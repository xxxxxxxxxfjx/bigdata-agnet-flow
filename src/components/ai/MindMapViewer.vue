<template>
  <div class="mindmap-wrapper" :class="{ fullscreen: isFullscreen }">
    <div class="mindmap-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v7m0 6v7M2 12h7m6 0h7"/>
      </svg>
      <span>思维导图</span>
      <span v-if="status === 'streaming'" class="badge">生成中...</span>
      <span v-else-if="renderError" class="badge badge-error">渲染失败</span>
      <span v-else class="hint">🖱️ 滚轮缩放 · 点击折叠</span>
      <div class="header-actions">
        <button class="hdr-btn" @click="download" title="下载图片" :disabled="!!renderError">⬇</button>
        <button class="hdr-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">{{ isFullscreen ? '✕' : '⛶' }}</button>
      </div>
    </div>
    <div class="mindmap-body" ref="bodyRef">
      <div v-if="!hasData && status !== 'streaming'" class="mindmap-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
          <circle cx="12" cy="12" r="3"/><path d="M12 2v7m0 6v7M2 12h7m6 0h7"/>
        </svg>
        <span>暂无思维导图数据</span>
      </div>
      <div v-if="renderError" class="mindmap-error">
        <span>⚠️ 思维导图渲染失败，请刷新页面后重试</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'

const transformer = new Transformer()

const props = defineProps({
  markdown: { type: String, default: '' },
  nodeTree: { type: Object, default: null },
  rootTitle: { type: String, default: '思维导图' },
  status: { type: String, default: 'done' }
})

const bodyRef = ref(null)
const isFullscreen = ref(false)
const renderError = ref(false)
const hasData = computed(() => !!(props.markdown?.trim() || props.nodeTree?.content))

let mm = null
let svgEl = null

const COLORS = ['#6366f1','#8b5cf6','#a855f7','#d946ef','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6']

const OPTS = {
  autoFit: false, duration: 400, maxWidth: 280, paddingX: 16,
  initialExpandLevel: 99, colorFreezeLevel: 3, zoom: true, pan: true,
  scrollForPan: true, toggleRecursively: true, nodeMinHeight: 36,
  spacingHorizontal: 60, spacingVertical: 12,
  lineWidth: () => 2,
  color: (node) => COLORS[Math.min(node.depth, COLORS.length - 1)]
}

function createSvgElement(container) {
  const el = container
  // 清理旧内容
  el.innerHTML = ''
  // 关键修复：markmap-view 0.18.x 要求传入 SVGElement，不能传 HTMLDivElement
  // d3.select(div) 会导致 SVG 子元素（g, circle, path, foreignObject）被创建在 HTML 命名空间，无法渲染
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.display = 'block'
  el.appendChild(svg)
  return svg
}

function toPlain(o) { try { return JSON.parse(JSON.stringify(o)) } catch { return null } }

function destroyMarkmap() {
  try { mm?.destroy() } catch (_) {}
  mm = null
  svgEl = null
}

async function render() {
  const container = bodyRef.value
  if (!container) return

  // 优先用 Transformer 解析 markdown；降级用 nodeTree
  let root = null
  if (props.markdown?.trim()) {
    try {
      const result = transformer.transform(props.markdown)
      root = result?.root
    } catch (_) {}
  }
  if (!root && props.nodeTree) {
    root = toPlain(props.nodeTree)
  }
  if (!root?.content) return

  try {
    if (!mm) {
      svgEl = createSvgElement(container)
      mm = Markmap.create(svgEl, OPTS)
    }
    await mm.setData(root)
    renderError.value = false
    if (props.status === 'done') await mm.fit()
  } catch (err) {
    console.error('Markmap:', err)
    renderError.value = true
    destroyMarkmap()
  }
}

// 全屏切换：需要重新创建 SVG（尺寸变化）
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  destroyMarkmap()
  nextTick(() => {
    if (hasData.value) {
      last = props.markdown
      render()
    }
  })
}

// 下载 SVG → PNG
async function download() {
  if (renderError.value) return
  const svg = bodyRef.value?.querySelector('svg')
  if (!svg) return
  try {
    const clone = svg.cloneNode(true)
    const bbox = svg.getBBox?.() || { x: 0, y: 0, width: 800, height: 600 }
    const W = 1200, H = 800, pad = 40
    const s = Math.min((W - pad * 2) / bbox.width, (H - pad * 2) / bbox.height)
    clone.setAttribute('width', String(W)); clone.setAttribute('height', String(H))
    clone.setAttribute('viewBox', `${bbox.x - (W/s - bbox.width)/2} ${bbox.y - (H/s - bbox.height)/2} ${W/s} ${H/s}`)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone))
    const img = new Image(); img.crossOrigin = 'anonymous'
    await new Promise((r, e) => { img.onload = r; img.onerror = e; img.src = dataUrl })
    const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2
    const ctx = c.getContext('2d'); ctx.scale(2, 2)
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H)
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png'); a.download = (props.rootTitle || '思维导图') + '.png'; a.click()
  } catch (_) {}
}

// 增量渲染：监听 markdown 变化
let timer = null, last = ''
function schedule() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (props.markdown && props.markdown !== last) { last = props.markdown; render() }
  }, 300)
}

watch(() => props.markdown, (v) => { if (v) schedule() })
watch(() => props.status, (v) => {
  if (v === 'done') {
    clearTimeout(timer)
    if (hasData.value) {
      last = props.markdown
      nextTick(render)
    }
  }
})
onMounted(() => {
  if (props.markdown) {
    last = props.markdown
    nextTick(render)
  } else if (props.nodeTree?.content) {
    // 仅有 nodeTree 无 markdown 时也渲染
    nextTick(render)
  }
})
onBeforeUnmount(() => { clearTimeout(timer); destroyMarkmap() })
</script>

<style scoped>
.mindmap-wrapper { margin: 16px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e5ea; background: #fff; }
.mindmap-wrapper.fullscreen { position: fixed; inset: 0; z-index: 9999; margin: 0; border-radius: 0; }
.mindmap-header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px; color: #64748b; background: #f5f6fa; border-bottom: 1px solid #e8eaf0; }
.badge { font-size: 11px; color: #6366f1; animation: pulse 1.5s infinite; }
.badge-error { color: #ef4444; animation: none; }
.hint { margin-left: 4px; font-size: 11px; color: #94a3b8; }
.header-actions { margin-left: auto; display: flex; gap: 2px; }
.hdr-btn { width: 28px; height: 26px; border: 1px solid #e2e5ea; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.hdr-btn:hover { background: #f1f3f6; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.mindmap-body { width: 100%; height: 460px; position: relative; }
.mindmap-placeholder, .mindmap-error { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: #94a3b8; font-size: 13px; pointer-events: none; }
.mindmap-error { color: #ef4444; }
.fullscreen .mindmap-body { height: calc(100vh - 42px); }
</style>
