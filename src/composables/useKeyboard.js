import { onMounted, onUnmounted } from 'vue'

/**
 * 全局键盘快捷键管理
 *
 * 支持：
 * - Delete / Backspace: 删除选中组件
 * - Ctrl+Z / Cmd+Z: 撤销
 * - Ctrl+Y / Cmd+Shift+Z: 重做
 * - Ctrl+C / Cmd+C: 复制
 * - Ctrl+V / Cmd+V: 粘贴
 * - Ctrl+S / Cmd+S: 保存
 * - Ctrl+A / Cmd+A: 全选
 * - Ctrl+D / Cmd+D: 复制并偏移
 * - Escape: 取消选中 / 关闭弹窗
 * - Arrow keys: 微移选中组件 (1px / Shift+10px)
 */

export function useKeyboard(handlers = {}) {
  const {
    onDelete = null,
    onUndo = null,
    onRedo = null,
    onCopy = null,
    onPaste = null,
    onSave = null,
    onSelectAll = null,
    onDuplicate = null,
    onEscape = null,
    onArrowUp = null,
    onArrowDown = null,
    onArrowLeft = null,
    onArrowRight = null,
  } = handlers

  function handleKeyDown(e) {
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)
    const isContentEditable = e.target.isContentEditable
    const mod = e.ctrlKey || e.metaKey

    // Delete — works everywhere except when typing
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput && !isContentEditable) {
      e.preventDefault()
      onDelete?.()
      return
    }

    // Escape
    if (e.key === 'Escape' && !isInput) {
      e.preventDefault()
      onEscape?.()
      return
    }

    // Ctrl/Cmd combos
    if (mod) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) {
            e.preventDefault()
            onRedo?.()
          } else {
            e.preventDefault()
            onUndo?.()
          }
          break
        case 'y':
          e.preventDefault()
          onRedo?.()
          break
        case 'c':
          if (!isInput && !isContentEditable) {
            e.preventDefault()
            onCopy?.()
          }
          break
        case 'v':
          if (!isInput && !isContentEditable) {
            e.preventDefault()
            onPaste?.()
          }
          break
        case 's':
          e.preventDefault()
          onSave?.()
          break
        case 'a':
          if (!isInput && !isContentEditable) {
            e.preventDefault()
            onSelectAll?.()
          }
          break
        case 'd':
          if (!isInput && !isContentEditable) {
            e.preventDefault()
            onDuplicate?.()
          }
          break
      }
      return
    }

    // Arrow keys for nudge (only when not in input)
    if (!isInput && !isContentEditable) {
      const step = e.shiftKey ? 10 : 1
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); onArrowUp?.(step); break
        case 'ArrowDown': e.preventDefault(); onArrowDown?.(step); break
        case 'ArrowLeft': e.preventDefault(); onArrowLeft?.(step); break
        case 'ArrowRight': e.preventDefault(); onArrowRight?.(step); break
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
}
