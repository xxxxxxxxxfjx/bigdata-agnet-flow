<template>
  <div class="mermaid-wrapper" :class="{ fullscreen: isFullscreen }">
    <div class="mermaid-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
      <span>Mermaid 图表</span>
      <span v-if="status === 'streaming'" class="badge">渲染中...</span>
      <div class="header-actions">
        <button class="hdr-btn" @click="showCode = !showCode" :title="showCode ? '查看图表' : '查看代码'">
          {{ showCode ? '📊' : '📝' }}
        </button>
        <button class="hdr-btn" @click="download" title="下载 SVG">⬇</button>
        <button class="hdr-btn" @click="zoomIn" title="放大">➕</button>
        <button class="hdr-btn" @click="zoomOut" title="缩小">➖</button>
        <button class="hdr-btn" @click="resetZoom" title="重置">↺</button>
        <button class="hdr-btn" @click="isFullscreen = !isFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
          {{ isFullscreen ? '✕' : '⛶' }}
        </button>
      </div>
    </div>
    <div class="mermaid-body" ref="bodyRef" @wheel.prevent="onWheel" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp">
      <div v-if="showCode" class="mermaid-code"><pre>{{ code }}</pre></div>
      <template v-else>
        <div v-if="status === 'streaming' && !lastSuccessSvg" class="mermaid-loading"><span class="spinner"></span>图表生成中...</div>
        <div v-if="renderError" class="mermaid-error">⚠️ {{ renderError }}</div>
        <div
          v-show="lastSuccessSvg"
          class="mermaid-svg-area"
          :style="{ transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})` }"
          v-html="lastSuccessSvg"
        ></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false, theme: 'base',
  themeVariables: { primaryColor: '#eef2ff', primaryTextColor: '#1e293b', primaryBorderColor: '#6366f1', lineColor: '#6366f1', secondaryColor: '#f8f9fb', tertiaryColor: '#ffffff' },
  securityLevel: 'loose'
})

const props = defineProps({
  code: { type: String, default: '' },
  status: { type: String, default: 'done' }
})

const bodyRef = ref(null)
const lastSuccessSvg = ref('')
const renderError = ref(null)
const showCode = ref(false)
const isFullscreen = ref(false)
const scale = ref(1)
const pan = ref({ x: 0, y: 0 })

let dragging = false, ds = { x: 0, y: 0, px: 0, py: 0 }

function onWheel(e) { const d = e.deltaY > 0 ? -0.12 : 0.12; scale.value = Math.max(0.25, Math.min(5, scale.value + d)) }
function onMouseDown(e) { if (e.button) return; dragging = true; ds = { x: e.clientX, y: e.clientY, px: pan.value.x, py: pan.value.y } }
function onMouseMove(e) { if (!dragging) return; pan.value = { x: ds.px + (e.clientX - ds.x), y: ds.py + (e.clientY - ds.y) } }
function onMouseUp() { dragging = false }

function zoomIn() { scale.value = Math.min(5, scale.value + 0.25) }
function zoomOut() { scale.value = Math.max(0.25, scale.value - 0.25) }
function resetZoom() { scale.value = 1; pan.value = { x: 0, y: 0 } }

function download() {
  if (!lastSuccessSvg.value) return
  const blob = new Blob([lastSuccessSvg.value], { type: 'image/svg+xml' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mermaid.svg'; a.click()
  URL.revokeObjectURL(a.href)
}

let timer = null, rid = 0
async function render() {
  if (!props.code?.trim()) return
  const id = ++rid
  try {
    const { svg } = await mermaid.render('mmd-' + Math.random().toString(36).slice(2, 8), props.code)
    if (id !== rid) return
    lastSuccessSvg.value = svg; renderError.value = null
  } catch (e) {
    if (id !== rid) return
    if (props.status === 'done') renderError.value = '语法错误: ' + (e.message || String(e)).slice(0, 60)
  }
}

watch(() => props.status, (v) => {
  if (v === 'streaming') { renderError.value = null; if (!timer) timer = setInterval(render, 800) }
  else { clearInterval(timer); timer = null; setTimeout(render, 100) }
}, { immediate: true })

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.mermaid-wrapper { margin: 16px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e5ea; background: #fff; }
.mermaid-wrapper.fullscreen { position: fixed; inset: 0; z-index: 9999; margin: 0; border-radius: 0; }
.mermaid-header { display: flex; align-items: center; gap: 6px; padding: 8px 12px; font-size: 13px; color: #64748b; background: #f5f6fa; border-bottom: 1px solid #e8eaf0; }
.badge { font-size: 11px; color: #6366f1; animation: pulse 1.5s infinite; }
.header-actions { margin-left: auto; display: flex; gap: 2px; }
.hdr-btn { width: 28px; height: 26px; border: 1px solid #e2e5ea; border-radius: 4px; background: #fff; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.hdr-btn:hover { background: #f1f3f6; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.mermaid-body { height: 460px; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; cursor: grab; user-select: none; }
.fullscreen .mermaid-body { height: calc(100vh - 42px); }
.mermaid-body:active { cursor: grabbing; }
.mermaid-svg-area { transform-origin: center; transition: transform 0.05s; }
.mermaid-svg-area :deep(svg) { max-height: 420px; width: auto; height: auto; }
.fullscreen .mermaid-svg-area :deep(svg) { max-height: calc(100vh - 80px); }
.mermaid-code { width: 100%; height: 100%; overflow: auto; padding: 14px; }
.mermaid-code pre { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #334155; white-space: pre-wrap; margin: 0; }
.mermaid-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; font-size: 13px; z-index: 1; }
.spinner { width: 16px; height: 16px; border: 2px solid #e8eaf0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.mermaid-error { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #f59e0b; font-size: 13px; }
</style>
