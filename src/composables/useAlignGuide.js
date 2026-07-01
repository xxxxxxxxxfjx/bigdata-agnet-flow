import { ref } from 'vue'

/**
 * 拖拽对齐辅助线计算
 * 当组件边缘接近其他组件边缘时，显示对齐参考线
 */

const SNAP_THRESHOLD = 5 // px, within this distance snap activates

export function useAlignGuide() {
  const guides = ref([]) // { type: 'h'|'v', position: number, range: [start, end] }

  /**
   * 计算对齐线
   * @param {Object} movingComp - 正在拖拽/缩放的组件 { x, y, w, h }
   * @param {Array} allComps - 所有其他组件
   * @param {string|null} excludeId - 排除的组件 ID
   */
  function computeGuides(movingComp, allComps, excludeId = null) {
    const lines = []
    const others = allComps.filter((c) => c.id !== excludeId)

    const mLeft = movingComp.x
    const mRight = movingComp.x + movingComp.w
    const mTop = movingComp.y
    const mBottom = movingComp.y + movingComp.h
    const mCenterX = movingComp.x + movingComp.w / 2
    const mCenterY = movingComp.y + movingComp.h / 2

    const snapResult = { x: movingComp.x, y: movingComp.y, w: movingComp.w, h: movingComp.h, snapped: false }

    for (const other of others) {
      const oLeft = other.x
      const oRight = other.x + other.w
      const oTop = other.y
      const oBottom = other.y + other.h
      const oCenterX = other.x + other.w / 2
      const oCenterY = other.y + other.h / 2

      const rangeV = [Math.min(mTop, oTop), Math.max(mBottom, oBottom)]

      // Vertical alignment (left edges)
      if (Math.abs(mLeft - oLeft) < SNAP_THRESHOLD) {
        lines.push({ type: 'v', position: oLeft, range: rangeV })
        snapResult.x = oLeft; snapResult.snapped = true
      }
      // Right edges
      if (Math.abs(mRight - oRight) < SNAP_THRESHOLD) {
        lines.push({ type: 'v', position: oRight, range: rangeV })
        snapResult.x = oRight - movingComp.w; snapResult.snapped = true
      }
      // Center X
      if (Math.abs(mCenterX - oCenterX) < SNAP_THRESHOLD) {
        lines.push({ type: 'v', position: oCenterX, range: rangeV })
        snapResult.x = oCenterX - movingComp.w / 2; snapResult.snapped = true
      }
      // Left to right
      if (Math.abs(mLeft - oRight) < SNAP_THRESHOLD) {
        lines.push({ type: 'v', position: oRight, range: rangeV })
      }
      // Right to left
      if (Math.abs(mRight - oLeft) < SNAP_THRESHOLD) {
        lines.push({ type: 'v', position: oLeft, range: rangeV })
      }

      const rangeH = [Math.min(mLeft, oLeft), Math.max(mRight, oRight)]

      // Horizontal alignment
      if (Math.abs(mTop - oTop) < SNAP_THRESHOLD) {
        lines.push({ type: 'h', position: oTop, range: rangeH })
        snapResult.y = oTop; snapResult.snapped = true
      }
      if (Math.abs(mBottom - oBottom) < SNAP_THRESHOLD) {
        lines.push({ type: 'h', position: oBottom, range: rangeH })
        snapResult.y = oBottom - movingComp.h; snapResult.snapped = true
      }
      if (Math.abs(mCenterY - oCenterY) < SNAP_THRESHOLD) {
        lines.push({ type: 'h', position: oCenterY, range: rangeH })
        snapResult.y = oCenterY - movingComp.h / 2; snapResult.snapped = true
      }
      if (Math.abs(mTop - oBottom) < SNAP_THRESHOLD) {
        lines.push({ type: 'h', position: oBottom, range: rangeH })
      }
      if (Math.abs(mBottom - oTop) < SNAP_THRESHOLD) {
        lines.push({ type: 'h', position: oTop, range: rangeH })
      }
    }

    // Deduplicate lines
    const deduped = []
    for (const line of lines) {
      const exists = deduped.find(
        (l) => l.type === line.type && Math.abs(l.position - line.position) < 1
      )
      if (!exists) {
        deduped.push(line)
      } else {
        exists.range = [
          Math.min(exists.range[0], line.range[0]),
          Math.max(exists.range[1], line.range[1]),
        ]
      }
    }

    guides.value = deduped
    return snapResult
  }

  function clearGuides() {
    guides.value = []
  }

  /**
   * 批量对齐操作
   */
  function alignComponents(components, type) {
    if (components.length < 2) return components

    const results = [...components]
    switch (type) {
      case 'left':
        const minX = Math.min(...results.map((c) => c.x))
        results.forEach((c) => { c.x = minX })
        break
      case 'right':
        const maxR = Math.max(...results.map((c) => c.x + c.w))
        results.forEach((c) => { c.x = maxR - c.w })
        break
      case 'top':
        const minY = Math.min(...results.map((c) => c.y))
        results.forEach((c) => { c.y = minY })
        break
      case 'bottom':
        const maxB = Math.max(...results.map((c) => c.y + c.h))
        results.forEach((c) => { c.y = maxB - c.h })
        break
      case 'centerH':
        const avgX = results.reduce((s, c) => s + c.x + c.w / 2, 0) / results.length
        results.forEach((c) => { c.x = avgX - c.w / 2 })
        break
      case 'centerV':
        const avgY = results.reduce((s, c) => s + c.y + c.h / 2, 0) / results.length
        results.forEach((c) => { c.y = avgY - c.h / 2 })
        break
      case 'distributeH':
        if (results.length < 3) break
        results.sort((a, b) => a.x - b.x)
        const totalW = results.reduce((s, c) => s + c.w, 0)
        const space = (results[results.length - 1].x - results[0].x - totalW) / (results.length - 1)
        let curX = results[0].x
        for (let i = 1; i < results.length; i++) {
          curX += results[i - 1].w + space
          results[i].x = curX
        }
        break
      case 'distributeV':
        if (results.length < 3) break
        results.sort((a, b) => a.y - b.y)
        const totalH = results.reduce((s, c) => s + c.h, 0)
        const spaceV = (results[results.length - 1].y - results[0].y - totalH) / (results.length - 1)
        let curY = results[0].y
        for (let i = 1; i < results.length; i++) {
          curY += results[i - 1].h + spaceV
          results[i].y = curY
        }
        break
    }
    return results
  }

  return {
    guides,
    computeGuides,
    clearGuides,
    alignComponents,
    SNAP_THRESHOLD,
  }
}
