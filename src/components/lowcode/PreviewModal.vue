<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'
import ChartRenderer from './ChartRenderer.vue'

const emit = defineEmits(['close'])
const { components, canvasStyle } = useCanvas()

const previewRef = ref(null)
const previewScale = ref(1)

const sortedComponents = computed(() => [...components.value].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)))
const bgStyle = computed(() => {
  const bg = canvasStyle.value.background
  if (bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient') || bg.startsWith('#'))) return { background: bg }
  return { background: '#0f172a' }
})

function computeScale() {
  const parent = previewRef.value?.parentElement
  if (!parent) return
  const cw = canvasStyle.value.width || 1920
  const ch = canvasStyle.value.height || 1080
  previewScale.value = Math.min((parent.clientWidth - 80) / cw, (parent.clientHeight - 80) / ch, 1)
}

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  computeScale()
  window.addEventListener('resize', computeScale)
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  window.removeEventListener('resize', computeScale)
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="preview-overlay" @click.self="emit('close')">
    <button class="preview-close" @click="emit('close')">退出预览</button>
    <div class="preview-info">
      预览 · {{ canvasStyle.width }} x {{ canvasStyle.height }} · 缩放 {{ Math.round(previewScale * 100) }}%
    </div>

    <div ref="previewRef" class="preview-stage">
      <div
        class="preview-canvas"
        :style="{
          ...bgStyle,
          width: canvasStyle.width + 'px',
          height: canvasStyle.height + 'px',
          transform: `scale(${previewScale})`,
          transformOrigin: 'center center',
        }"
      >
        <div
          v-for="comp in sortedComponents"
          :key="comp.id"
          class="preview-component"
          :style="{
            left: comp.x + 'px',
            top: comp.y + 'px',
            width: comp.w + 'px',
            height: comp.h + 'px',
            zIndex: comp.zIndex || 1,
            opacity: comp.data?.style?.opacity ?? 1,
            borderRadius: (comp.data?.style?.borderRadius || 0) + 'px',
            boxShadow: comp.data?.style?.boxShadow || 'none',
            background: comp.data?.style?.background || 'transparent',
            border: comp.data?.style?.border || 'none',
          }"
        >
          <ChartRenderer :type="comp.type" :config="comp.data?.config || {}" :width="comp.w" :height="comp.h" />
        </div>

        <div v-if="components.length === 0" class="preview-empty">
          <strong>画布为空</strong>
          <span>请先添加组件后再预览。</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000000;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10001;
  height: 36px;
  padding: 0 16px;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 6px;
  color: #ffffff;
  background: rgba(255,255,255,0.1);
  cursor: pointer;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.preview-close:hover {
  background: rgba(239, 68, 68, 0.28);
  border-color: rgba(239, 68, 68, 0.5);
}

.preview-info {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 10001;
  padding: 6px 14px;
  border-radius: 999px;
  color: rgba(255,255,255,0.52);
  background: rgba(0,0,0,0.45);
  font: 12px Consolas, Monaco, monospace;
  pointer-events: none;
}

.preview-stage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-canvas {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.preview-component {
  position: absolute;
  overflow: hidden;
  pointer-events: none;
}

.preview-empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
}

.preview-empty strong {
  color: #e2e8f0;
  font-size: 20px;
}
</style>
