<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCanvas } from '../../composables/useCanvas.js'
import ChartRenderer from './ChartRenderer.vue'

const emit = defineEmits(['close'])

const { components, canvasStyle } = useCanvas()

const previewRef = ref(null)
const previewScale = ref(1)

// Sort components by zIndex
const sortedComponents = computed(() => {
  return [...components.value].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
})

function computeScale() {
  if (!previewRef.value) return
  const parent = previewRef.value.parentElement
  if (!parent) return

  const pw = parent.clientWidth
  const ph = parent.clientHeight
  const cw = canvasStyle.value.width || 1920
  const ch = canvasStyle.value.height || 1080

  // Fit the design resolution into the viewport with padding
  const padX = 40
  const padY = 40
  const scaleX = (pw - padX * 2) / cw
  const scaleY = (ph - padY * 2) / ch

  previewScale.value = Math.min(scaleX, scaleY, 1)
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

// Background style
const bgStyle = computed(() => {
  const bg = canvasStyle.value.background
  if (bg && (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient') || bg.startsWith('#'))) {
    return { background: bg }
  }
  return { background: '#0f172a' }
})

onMounted(() => {
  computeScale()
  window.addEventListener('resize', computeScale)
  document.addEventListener('keydown', onKeydown)
  // Prevent body scrolling
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
    <!-- Close button -->
    <button class="preview-close" @click="emit('close')">
      ✕ 退出预览
    </button>

    <!-- Preview info -->
    <div class="preview-info">
      预览 · {{ canvasStyle.width }} × {{ canvasStyle.height }} · 缩放 {{ Math.round(previewScale * 100) }}%
    </div>

    <!-- Scaled canvas -->
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
        <!-- Render components -->
        <div
          v-for="comp in sortedComponents"
          :key="comp.id"
          class="preview-component"
          :style="{
            position: 'absolute',
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
            overflow: 'hidden',
          }"
        >
          <ChartRenderer
            :type="comp.type"
            :config="comp.data?.config || {}"
            :width="comp.w"
            :height="comp.h"
          />
        </div>

        <!-- Empty state -->
        <div v-if="components.length === 0" class="preview-empty">
          <div class="empty-icon">📊</div>
          <div class="empty-text">画布为空，请先添加组件</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000000;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}

.preview-close:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.5);
}

.preview-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10001;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  font-family: monospace;
  background: rgba(0,0,0,0.4);
  padding: 6px 14px;
  border-radius: 20px;
  pointer-events: none;
}

.preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.preview-canvas {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.preview-component {
  pointer-events: none;
}

.preview-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.3;
}

.empty-text {
  font-size: 18px;
  color: #64748b;
  margin-top: 12px;
}
</style>
