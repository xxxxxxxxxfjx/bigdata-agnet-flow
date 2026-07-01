import { ref, computed } from 'vue'

const MAX_HISTORY = 50

// Module-level singleton state
const history = ref([])
const historyIndex = ref(-1)

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

export function useHistory() {
  function pushSnapshot(snapshot) {
    // Discard any future history if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(snapshot)

    // Limit history size
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(history.value.length - MAX_HISTORY)
    }

    historyIndex.value = history.value.length - 1
  }

  function undo() {
    if (!canUndo.value) return null
    historyIndex.value--
    return JSON.parse(JSON.stringify(history.value[historyIndex.value]))
  }

  function redo() {
    if (!canRedo.value) return null
    historyIndex.value++
    return JSON.parse(JSON.stringify(history.value[historyIndex.value]))
  }

  function clearHistory() {
    history.value = []
    historyIndex.value = -1
  }

  return {
    canUndo,
    canRedo,
    pushSnapshot,
    undo,
    redo,
    clearHistory,
    historyCount: computed(() => history.value.length),
  }
}
