<template>
  <div class="mindmap-wrapper" :class="{ fullscreen: isFullscreen }">
    <div class="mindmap-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"/><path d="M12 2v7m0 6v7M2 12h7m6 0h7"/>
      </svg>
      <span>思维导图</span>
      <span v-if="status === 'streaming'" class="badge">生成中...</span>
      <span v-else class="hint">🖱️ 滚轮缩放 · 点击折叠</span>
      <div class="header-actions">
        <button class="hdr-btn" @click="download" title="下载图片">⬇</button>
        <button class="hdr-btn" @click="isFullscreen = !isFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">{{ isFullscreen ? '✕' : '⛶' }}</button>
      </div>
    </div>
    <div class="mindmap-body" ref="bodyRef"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'

const transformer = new Transformer()

const props = defineProps({
  markdown: { type: String, default: '' },
  rootTitle: { type: String, default: '思维导图' },
  status: { type: String, default: 'done' }
})

const bodyRef = ref(null)
const isFullscreen = ref(false)
let mm = null

const LEVEL_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6']

const OPTS = {
  autoFit: false, duration: 400, maxWidth: 280, paddingX: 16,
  initialExpandLevel: 99, colorFreezeLevel: 3, zoom: true, pan: true,
  scrollForPan: true, toggleRecursively: true, nodeMinHeight: 36,
  spacingHorizontal: 60, spacingVertical: 12,
  lineWidth: () => 2,
  color: (node) => LEVEL_COLORS[Math.min(node.depth, LEVEL_COLORS.length - 1)]
}

// formatNode：深度 < 3 加粗
function formatNode(node, depth = 1) {
  if (!node) return
  if (depth < 3) {
    node.content = `<div style="word-break:break-all;"><strong>${node.content}</strong></div>`
  } else {
    node.content = `<div style="word-break:break-all;font-weight:400;">${node.content}</div>`
  }
  for (const c of (node.children || [])) formatNode(c, depth + 1)
}

async function render() {
  const el = bodyRef.value
  if (!el || !props.markdown?.trim()) return

  const { root } = transformer.transform(props.markdown)
  if (!root) return
  formatNode(root, 1)

  try {
    if (!mm) {
      // 清空容器后直接传给 Markmap.create，让它自己创建 SVG 并注入 CSS 变量
      el.innerHTML = ''
      mm = Markmap.create(el, OPTS)
    }
    await mm.setData(root)
    if (props.status === 'done') await mm.fit()
  } catch (err) {
    console.error('Markmap:', err)
    try { mm?.destroy() } catch (_) {}; mm = null
  }
}

// 下载：SVG → Canvas → PNG
async function download() {
  const svgEl = bodyRef.value?.querySelector('svg')
  if (!svgEl) return

  try {
    // 展开所有节点
    const allNodes = mm?.state?.data ? [mm.state.data] : []
    // 克隆 SVG
    const clone = svgEl.cloneNode(true)
    const bbox = svgEl.getBBox?.() || { x: 0, y: 0, width: 800, height: 600 }

    const W = 1200, H = 800, pad = 40
    const scale = Math.min((W - pad * 2) / bbox.width, (H - pad * 2) / bbox.height)
    clone.setAttribute('width', String(W)); clone.setAttribute('height', String(H))
    clone.setAttribute('viewBox', `${bbox.x - (W / scale - bbox.width) / 2} ${bbox.y - (H / scale - bbox.height) / 2} ${W / scale} ${H / scale}`)
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone))

    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = svgData })

    const canvas = document.createElement('canvas')
    canvas.width = W * 2; canvas.height = H * 2
    const ctx = canvas.getContext('2d')
    ctx.scale(2, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    ctx.drawImage(img, 0, 0, W, H)

    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = (props.rootTitle || '思维导图') + '.png'
    a.click()
  } catch (err) { console.error('Download:', err) }
}

// 增量渲染：监听 markdown 变化（Vue 响应式自动触发），用 timer 去抖
let renderTimer = null
let lastMd = ''

function scheduleRender() {
  clearTimeout(renderTimer)
  renderTimer = setTimeout(() => { if (props.markdown && props.markdown !== lastMd) { lastMd = props.markdown; render() } }, 300)
}

watch(() => props.markdown, (md) => { if (md) scheduleRender() })
watch(() => props.status, (v) => { if (v === 'done') { clearTimeout(renderTimer); nextTick(render) } })
watch(isFullscreen, () => { mm = null; nextTick(render) })
onMounted(() => { if (props.markdown) { lastMd = props.markdown; nextTick(render) } })
onBeforeUnmount(() => { clearTimeout(renderTimer); try { mm?.destroy() } catch (_) {}; mm = null })
</script>

<style scoped>
.mindmap-wrapper { margin: 16px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e5ea; background: #fff; }
.mindmap-wrapper.fullscreen { position: fixed; inset: 0; z-index: 9999; margin: 0; border-radius: 0; }
.mindmap-header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px; color: #64748b; background: #f5f6fa; border-bottom: 1px solid #e8eaf0; }
.badge { font-size: 11px; color: #6366f1; animation: pulse 1.5s infinite; }
.hint { margin-left: 4px; font-size: 11px; color: #94a3b8; }
.header-actions { margin-left: auto; display: flex; gap: 2px; }
.hdr-btn { width: 28px; height: 26px; border: 1px solid #e2e5ea; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.hdr-btn:hover { background: #f1f3f6; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.mindmap-body { width: 100%; height: 460px; position: relative; }
.fullscreen .mindmap-body { height: calc(100vh - 42px); }
</style>
