<template>
  <div class="message-content">
    <template v-for="block in blocks" :key="block.id">
      <!-- 深度思考 -->
      <ThinkingBlock v-if="block.type === 'thinking'" :content="block.content" :status="block.status" />
      <!-- 富文本 -->
      <div v-else-if="block.type === 'text'" class="text-block" v-html="renderedText(block)" />
      <!-- 代码块 -->
      <CodeBlock v-else-if="block.type === 'code'" :code="block.content" :language="block.language" />
      <!-- 公式 -->
      <KaTeXFormula v-else-if="block.type === 'formula'" :formula="block.formula" :display-mode="block.displayMode !== false" />
      <!-- 思维导图 -->
      <MindMapViewer v-else-if="block.type === 'mindmap'" :markdown="block.markdown" :node-tree="block.nodeTree" :root-title="block.rootTitle" :status="block.status" />
      <!-- Mermaid -->
      <MermaidBlock v-else-if="block.type === 'mermaid'" :code="block.code" :status="block.status" />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ThinkingBlock from './ThinkingBlock.vue'
import CodeBlock from './CodeBlock.vue'
import KaTeXFormula from './KaTeXFormula.vue'
import MindMapViewer from './MindMapViewer.vue'
import MermaidBlock from './MermaidBlock.vue'
import { renderMarkdown } from '../../composables/useMarkdown.js'

const props = defineProps({
  blocks: { type: Array, default: () => [] },
  isStreaming: { type: Boolean, default: false }
})

// 对每个 text block 预计算渲染结果，Vue 自动做最小 DOM 更新
const textHtmlMap = computed(() => {
  const map = {}
  for (const b of props.blocks) {
    if (b.type === 'text') map[b.id] = renderMarkdown(b.content || '')
  }
  return map
})

function renderedText(block) {
  return textHtmlMap.value[block.id] || ''
}
</script>

<style>
/* ===== Markdown 渲染样式（全局，因为 v-html 不受 scoped 影响） ===== */
.markdown-body { color: #334155; font-size: 15px; line-height: 1.85; word-break: break-word; }
.markdown-body h1 { font-size: 24px; font-weight: 700; margin: 28px 0 14px; color: #0f172a; border-bottom: 2px solid #e2e5ea; padding-bottom: 10px; }
.markdown-body h2 { font-size: 20px; font-weight: 700; margin: 24px 0 12px; color: #1e293b; padding-left: 12px; border-left: 4px solid #6366f1; }
.markdown-body h3 { font-size: 17px; font-weight: 600; margin: 20px 0 10px; color: #1e293b; }
.markdown-body h4 { font-size: 15px; font-weight: 600; margin: 16px 0 8px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
.markdown-body p { margin: 10px 0; }
.markdown-body ul, .markdown-body ol { margin: 10px 0; padding-left: 22px; }
.markdown-body li { margin: 6px 0; }
.markdown-body li::marker { color: #6366f1; }
.markdown-body strong { color: #0f172a; font-weight: 700; }
.markdown-body em { color: #475569; }
.markdown-body a { color: #6366f1; text-decoration: none; border-bottom: 1.5px solid #c7d2fe; transition: all 0.2s; }
.markdown-body a:hover { border-bottom-color: #6366f1; color: #4f46e5; }
.markdown-body blockquote { margin: 14px 0; padding: 12px 18px; border-left: 4px solid #6366f1; background: linear-gradient(90deg, #f0f4ff 0%, #f8f9fb 100%); border-radius: 0 8px 8px 0; color: #475569; }
.markdown-body blockquote p { margin: 4px 0; }
.markdown-body hr { margin: 20px 0; border: none; height: 1px; background: linear-gradient(90deg, #e8eaf0, #cbd5e1, #e8eaf0); }
.markdown-body .table-wrapper { margin: 16px 0; overflow-x: auto; border-radius: 8px; border: 1px solid #e2e5ea; }
.markdown-body table { width: 100%; border-collapse: collapse; font-size: 14px; }
.markdown-body thead th {
  background: #6366f1; color: #ffffff; font-weight: 600; padding: 10px 14px;
  text-align: left; font-size: 13px; white-space: nowrap;
}
.markdown-body thead th:first-child { border-radius: 7px 0 0 0; }
.markdown-body thead th:last-child { border-radius: 0 7px 0 0; }
.markdown-body td { padding: 9px 14px; border-bottom: 1px solid #f1f3f6; color: #334155; }
.markdown-body tbody tr:nth-child(even) { background: #fafbfd; }
.markdown-body tbody tr:hover { background: #eef2ff; }
.markdown-body tbody tr:last-child td:first-child { border-radius: 0 0 0 7px; }
.markdown-body tbody tr:last-child td:last-child { border-radius: 0 0 7px 0; }
.markdown-body code.inline-code { background: #f0f4ff; color: #4f46e5; padding: 2px 7px; border-radius: 4px; font-size: 0.9em; font-family: 'JetBrains Mono','Fira Code','Consolas',monospace; border: 1px solid #e0e7ff; }
.markdown-body .code-block-wrapper { margin: 14px 0; border-radius: 10px; overflow: hidden; border: 1px solid #e2e5ea; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.markdown-body .code-block-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: #f5f6fa; border-bottom: 1px solid #e8eaf0; }
.markdown-body .code-lang { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
.markdown-body .code-copy-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; color: #94a3b8; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
.markdown-body .code-copy-btn:hover { color: #475569; background: #e8eaf0; }
.markdown-body .code-block-body { margin: 0; padding: 14px 18px; overflow-x: auto; background: #fafbfc; font-size: 13px; font-family: 'JetBrains Mono','Fira Code','Consolas',monospace; }
.markdown-body .code-block-body code { font-family: inherit; font-size: inherit; line-height: 1.7; }
.markdown-body .katex-display { margin: 18px 0; padding: 10px 0; overflow-x: auto; }
.markdown-body .katex { font-size: 1.1em; }
.markdown-body img { max-width: 100%; border-radius: 10px; margin: 12px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.markdown-body input[type="checkbox"] { margin-right: 8px; accent-color: #6366f1; transform: scale(1.1); }
.markdown-body ::selection { background: #e0e7ff; color: #3730a3; }
.markdown-body .katex-error { color: #94a3b8 !important; border: none !important; background: transparent !important; padding: 0 !important; }
</style>

<style scoped>
.message-content { line-height: 1.75; }
.text-block { word-break: break-word; }
</style>
