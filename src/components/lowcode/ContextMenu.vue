<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  items: { type: Array, default: () => [] },
  // Each item: { label, icon, action, divider, disabled, danger }
})

const emit = defineEmits(['close'])

const menuRef = ref(null)

function closeMenu() {
  emit('close')
}

function onItemClick(item) {
  if (item.disabled) return
  item.action?.()
  emit('close')
}

function onMouseDown(e) {
  e.stopPropagation()
  e.preventDefault()
}

onMounted(() => {
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<template>
  <div
    v-if="visible"
    ref="menuRef"
    class="context-menu"
    :style="{ left: x + 'px', top: y + 'px' }"
    @mousedown="onMouseDown"
    @click.stop
  >
    <template v-for="(item, i) in items" :key="i">
      <div v-if="item.divider" class="menu-divider"></div>
      <button
        v-else
        class="menu-item"
        :class="{ danger: item.danger, disabled: item.disabled }"
        @click="onItemClick(item)"
      >
        <span class="menu-icon" v-if="item.icon">{{ item.icon }}</span>
        <span class="menu-label">{{ item.label }}</span>
        <span class="menu-shortcut" v-if="item.shortcut">{{ item.shortcut }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 50000;
  min-width: 180px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  padding: 6px;
  overflow: hidden;
}

.menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  color: #334155;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.1s;
  text-align: left;
}

.menu-item:hover:not(.disabled) {
  background: #f1f5f9;
}

.menu-item.danger:hover:not(.disabled) {
  background: #fef2f2;
  color: #dc2626;
}

.menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.menu-label {
  flex: 1;
}

.menu-shortcut {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}
</style>
