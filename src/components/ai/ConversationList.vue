<template>
  <div class="conversation-list">
    <div class="list-header">
      <span class="list-title">对话历史</span>
      <button class="btn-new-chat" @click="$emit('newChat')" title="新建对话">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span>新对话</span>
      </button>
    </div>
    <div class="list-body">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        :class="['conv-item', { active: conv.id === currentId }]"
        @click="$emit('switch', conv.id)"
      >
        <div class="conv-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        </div>
        <div class="conv-title">{{ conv.title }}</div>
        <button class="btn-delete" @click.stop="$emit('delete', conv.id)" title="删除对话">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div v-if="conversations.length === 0" class="list-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span>暂无对话</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: { type: Array, default: () => [] },
  currentId: { type: String, default: null }
})
defineEmits(['newChat', 'switch', 'delete'])
</script>

<style scoped>
.conversation-list {
  display: flex; flex-direction: column; height: 100%;
  background: #f0f1f5; border-right: 1px solid #e8eaf0;
}
.list-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid #e8eaf0;
}
.list-title { font-size: 14px; font-weight: 600; color: #334155; }
.btn-new-chat {
  display: flex; align-items: center; gap: 4px; padding: 6px 10px;
  font-size: 12px; color: #6366f1; background: #eef2ff;
  border: 1px solid #c7d2fe; border-radius: 6px; cursor: pointer; transition: all 0.2s;
}
.btn-new-chat:hover { background: #e0e7ff; }
.list-body { flex: 1; overflow-y: auto; padding: 8px; }
.conv-item {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-radius: 8px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px;
}
.conv-item:hover { background: #e8eaf0; }
.conv-item.active { background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.conv-icon { flex-shrink: 0; color: #94a3b8; }
.conv-item.active .conv-icon { color: #6366f1; }
.conv-title {
  flex: 1; font-size: 13px; color: #64748b;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.conv-item.active .conv-title { color: #1e293b; font-weight: 500; }
.btn-delete {
  flex-shrink: 0; width: 24px; height: 24px; border: none;
  background: transparent; color: #c0c8d4; border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: all 0.2s;
}
.conv-item:hover .btn-delete { opacity: 1; }
.btn-delete:hover { color: #ef4444; background: #fef2f2; }
.list-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 40px 20px;
  color: #94a3b8; font-size: 13px;
}
</style>
