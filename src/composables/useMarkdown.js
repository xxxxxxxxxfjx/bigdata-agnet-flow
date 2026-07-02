/**
 * Markdown 解析与渲染 Composable
 *
 * 功能：
 * 1. 配置 marked 解析器（代码高亮、KaTeX 公式、表格、任务列表等）
 * 2. 增量 Markdown 渲染（按段落追加，避免全量重建 DOM）
 * 3. 行内公式 ($...$) 和块级公式 ($$...$$) 的 KaTeX 渲染
 */

import { marked } from 'marked'
import katex from 'katex'
import hljs from 'highlight.js'

// ===== 配置 marked =====

// 自定义渲染器
const renderer = new marked.Renderer()

// 代码块渲染（使用 highlight.js）
renderer.code = function ({ text, lang, escaped }) {
  const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext'

  let highlighted
  try {
    highlighted = hljs.highlight(text, { language: validLang }).value
  } catch {
    highlighted = hljs.highlightAuto(text).value
  }

  // 生成唯一 ID 用于复制按钮定位
  const codeId = 'code-' + Math.random().toString(36).substring(2, 8)

  return `
<div class="code-block-wrapper" data-code-id="${codeId}">
  <div class="code-block-header">
    <span class="code-lang">${validLang}</span>
    <button class="code-copy-btn" data-code-id="${codeId}" title="复制代码">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
      </svg>
    </button>
  </div>
  <pre class="code-block-body"><code class="hljs">${highlighted}</code></pre>
</div>`
}

// 行内代码
renderer.codespan = function ({ text }) {
  return `<code class="inline-code">${text}</code>`
}

// 链接（新窗口打开）
renderer.link = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : ''
  return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`
}

// 图片
renderer.image = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : ''
  return `<img src="${href}" alt="${text}"${titleAttr} loading="lazy" style="max-width:100%;" />`
}

// 配置 marked 全局选项
marked.setOptions({
  renderer,
  gfm: true,              // GitHub Flavored Markdown
  breaks: true,           // 换行符转 <br>
  pedantic: false,
})

// ===== KaTeX 渲染 =====

/**
 * 渲染行内公式：$...$
 * 在 marked 解析后的 HTML 中处理
 */
function renderInlineFormulas(html) {
  // 匹配不在代码块内的 $...$（行内公式）
  return html.replace(/(?<!\\)\$([^$\n]+?)(?<!\\)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
        trust: true
      })
    } catch {
      return match // 渲染失败保留原文
    }
  })
}

/**
 * 渲染块级公式：$$...$$
 */
function renderBlockFormulas(html) {
  return html.replace(/<p>\s*\$\$\s*([\s\S]*?)\s*\$\$\s*<\/p>/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
        trust: true
      })
    } catch {
      return match
    }
  })
}

// ===== 核心导出 =====

/**
 * 完整渲染 Markdown 文本（含 KaTeX 后处理）
 * @param {string} text - Markdown 文本
 * @returns {string} HTML 字符串
 */
export function renderMarkdown(text) {
  if (!text) return ''

  // 1. marked 解析
  let html = marked.parse(text)

  // 2. 表格 wrapper
  html = html.replace(/<table>/g, '<div class="table-wrapper"><table>')
  html = html.replace(/<\/table>/g, '</table></div>')

  // 3. KaTeX 后处理
  html = renderBlockFormulas(html)
  html = renderInlineFormulas(html)

  // 4. 包裹 .markdown-body 让 CSS 选择器生效
  html = `<div class="markdown-body">${html}</div>`

  return html
}

/**
 * 增量 Markdown 渲染
 *
 * 策略：按段落（双换行）为最小单位追加，
 * 避免每次 text_delta 都全量重建 DOM。
 *
 * @param {string} fullText - 完整文本
 * @param {number} lastRenderedLen - 上次渲染到的字符位置
 * @returns {{ html: string, newLength: number }}
 *   - html: 本次新增的 HTML（可直接 insertAdjacentHTML）
 *   - newLength: 新的已渲染长度（如果返回 0 表示没有完整段落可渲染）
 */
export function incrementalRender(fullText, lastRenderedLen = 0) {
  if (lastRenderedLen === 0) {
    return { html: renderMarkdown(fullText), newLength: fullText.length }
  }

  const delta = fullText.slice(lastRenderedLen)

  // 找最后一个安全的截断边界（\n\n）
  let cutPoint = delta.lastIndexOf('\n\n')
  if (cutPoint === -1) return { html: '', newLength: lastRenderedLen }

  let completePart = delta.slice(0, cutPoint + 2)

  // 检查完整部分是否包含未闭合的表格（表格不允许中间有空行）
  // 如果截断点在表格内部，回退到表格开始前
  const tableStart = completePart.lastIndexOf('\n|')
  if (tableStart !== -1) {
    const afterTableStart = completePart.slice(tableStart)
    // 表格必须包含至少一个分隔行（|----|）
    if (!/\|-+[-|]*\|/.test(afterTableStart)) {
      // 截断点在表格头或表格中间，回退到表格之前
      const safeCut = delta.slice(0, cutPoint).lastIndexOf('\n\n')
      if (safeCut !== -1) {
        cutPoint = safeCut
        completePart = delta.slice(0, cutPoint + 2)
      } else {
        return { html: '', newLength: lastRenderedLen }
      }
    }
  }

  if (!completePart.trim()) return { html: '', newLength: lastRenderedLen }

  const renderedHtml = renderMarkdown(completePart)
  return {
    html: renderedHtml,
    newLength: lastRenderedLen + completePart.length
  }
}

/**
 * 渲染行内 Markdown（用于思考块等非块级渲染场景）
 * 只处理：加粗、斜体、行内代码、行内公式、链接
 * @param {string} text
 * @returns {string}
 */
export function renderInlineMarkdown(text) {
  if (!text) return ''

  // 使用 marked 的 inline 解析
  let html = marked.parseInline(text)

  // KaTeX 行内公式
  html = renderInlineFormulas(html)

  return html
}

/**
 * 渲染块级 LaTeX 公式
 * @param {string} formula - LaTeX 字符串
 * @param {boolean} displayMode - 是否块级显示
 * @returns {string} HTML 字符串
 */
export function renderFormula(formula, displayMode = true) {
  try {
    return katex.renderToString(formula, {
      throwOnError: false,
      displayMode,
      trust: true
    })
  } catch (err) {
    return `<span class="katex-error" title="${err.message}">${formula}</span>`
  }
}

// ===== 代码块复制功能 =====

/**
 * 为代码块绑定复制事件（需要在 DOM 挂载后调用）
 * @param {HTMLElement} container - 包含代码块的容器元素
 */
export function bindCodeCopyButtons(container) {
  if (!container) return

  container.querySelectorAll('.code-copy-btn').forEach(btn => {
    // 避免重复绑定
    if (btn.dataset.bound === 'true') return
    btn.dataset.bound = 'true'

    btn.addEventListener('click', () => {
      const wrapper = btn.closest('.code-block-wrapper')
      if (!wrapper) return

      const code = wrapper.querySelector('code')
      const text = code?.textContent || ''

      navigator.clipboard.writeText(text).then(() => {
        // 复制成功提示
        const originalHTML = btn.innerHTML
        btn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>`
        btn.classList.add('copied')
        setTimeout(() => {
          btn.innerHTML = originalHTML
          btn.classList.remove('copied')
        }, 2000)
      }).catch(() => {
        // 降级方案
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      })
    })
  })
}

export { marked, renderer }
