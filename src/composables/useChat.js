/**
 * AI 对话状态管理 Composable
 *
 * 核心功能：
 * 1. 对话和消息的增删改查
 * 2. SSE 事件流处理 → Block 增量更新
 * 3. Mock 模式和 DeepSeek API 模式无缝切换
 * 4. 停止生成、重新生成、清空对话
 *
 * 数据结构：
 *   Message = { id, role, blocks[], meta }
 *   Block   = { id, type, status, content/... }
 *
 * 模块级单例模式（与项目 useWorkflow.js / useCanvas.js 一致）
 */

import { ref, computed } from 'vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { USE_MOCK, API_CONFIG, currentModel } from '../config/aiModels.js'
import { matchScenario } from '../mock/aiResponse.js'
import { createMockSSEStream } from '../mock/streamSimulator.js'

// ===== 工具函数 =====
function generateId(prefix = '') {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}${timestamp}${random}`
}

// ===== 模块级单例状态 =====
const conversations = ref([])            // 所有对话列表
const currentConversationId = ref(null)  // 当前对话 ID
const messages = ref([])                 // 当前对话的消息列表
const isStreaming = ref(false)           // 是否正在流式输出
const abortController = ref(null)        // 用于中断 SSE 流

// ===== 计算属性 =====
const currentConversation = computed(() =>
  conversations.value.find(c => c.id === currentConversationId.value)
)

const lastUserMessage = computed(() => {
  const reversed = [...messages.value].reverse()
  return reversed.find(m => m.role === 'user')
})

// ===== 对话管理 =====

function createNewConversation(title = '新对话') {
  const conversation = {
    id: generateId('conv_'),
    title,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  conversations.value.unshift(conversation)
  switchConversation(conversation.id)
  return conversation
}

function switchConversation(conversationId) {
  // 保存当前对话消息（如果存在）
  if (currentConversationId.value) {
    const conv = conversations.value.find(c => c.id === currentConversationId.value)
    if (conv) {
      conv._messages = [...messages.value]
    }
  }

  currentConversationId.value = conversationId

  // 恢复目标对话消息
  const conv = conversations.value.find(c => c.id === conversationId)
  messages.value = conv?._messages || []
}

function deleteConversation(conversationId) {
  const idx = conversations.value.findIndex(c => c.id === conversationId)
  if (idx !== -1) {
    conversations.value.splice(idx, 1)
  }

  if (currentConversationId.value === conversationId) {
    if (conversations.value.length > 0) {
      switchConversation(conversations.value[0].id)
    } else {
      currentConversationId.value = null
      messages.value = []
    }
  }
}

// ===== 消息管理 =====

function createUserMessage(text) {
  return {
    id: generateId('msg_'),
    role: 'user',
    content: text,
    timestamp: Date.now()
  }
}

function createAssistantMessage() {
  return {
    id: generateId('msg_'),
    role: 'assistant',
    blocks: [],
    meta: {
      model: currentModel?.id || 'unknown',
      usage: null,
      duration: 0
    },
    timestamp: Date.now(),
    _startTime: Date.now()  // 用于计算生成耗时
  }
}

// ===== SSE 事件处理核心 =====

/**
 * 发送消息入口
 * @param {string} text - 用户输入文本
 */
async function sendMessage(text) {
  if (!text.trim() || isStreaming.value) return

  // 如果没有当前对话，自动创建
  if (!currentConversationId.value) {
    createNewConversation(text.slice(0, 30))
  }

  // 1. 添加 user message
  const userMsg = createUserMessage(text.trim())
  messages.value.push(userMsg)

  // 更新对话标题（取第一条用户消息前30字）
  if (currentConversation.value) {
    currentConversation.value.title = text.trim().slice(0, 30) + (text.length > 30 ? '...' : '')
    currentConversation.value.updatedAt = Date.now()
  }

  // 2. 创建空的 assistant message
  const assistantMsg = createAssistantMessage()
  messages.value.push(assistantMsg)

  // 3. 开始流式接收
  isStreaming.value = true
  const startTime = Date.now()

  if (USE_MOCK) {
    // Mock 模式
    await startMockStream(text, assistantMsg)
  } else {
    // DeepSeek API 模式
    await startDeepSeekStream(assistantMsg)
  }

  assistantMsg.meta.duration = ((Date.now() - startTime) / 1000).toFixed(1)

  // 更新对话时间
  if (currentConversation.value) {
    currentConversation.value.updatedAt = Date.now()
  }
}

/**
 * Mock 模式 SSE 流
 */
async function startMockStream(userInput, assistantMsg) {
  const scenarioFn = matchScenario(userInput)
  const mockData = scenarioFn()

  const stream = createMockSSEStream(mockData)
  abortController.value = stream.controller

  const textBlockRenderedLength = {} // { blockId: renderedCharCount }

  // 关键：始终通过 messages.value 获取反应式代理对象，
  // 否则 Vue 无法追踪到 blocks 数组的变更，导致 UI 不更新
  function getReactiveMsg() {
    return messages.value[messages.value.length - 1]
  }

  await stream.start(
    // onopen
    () => {},
    // onmessage
    (event) => {
      handleSSEEvent(event, getReactiveMsg(), textBlockRenderedLength)
    },
    // onclose
    () => {
      finishStream(getReactiveMsg())
    },
    // onerror
    (err) => {
      console.error('Mock stream error:', err)
      handleStreamError(getReactiveMsg(), err.message)
    }
  )
}

/**
 * DeepSeek API 模式 SSE 流
 */
async function startDeepSeekStream(assistantMsg) {
  const ctrl = new AbortController()
  abortController.value = ctrl

  // 构建消息上下文（排除最后一条 assistant 消息）
  const contextMessages = buildDeepSeekContext(messages.value.slice(0, -1))

  function getReactiveMsg() {
    return messages.value[messages.value.length - 1]
  }

  try {
    await fetchEventSource(API_CONFIG.apiUrl, {
      method: 'POST',
      headers: API_CONFIG.headers,
      body: JSON.stringify({
        model: currentModel.id,
        messages: contextMessages,
        stream: true,
        stream_options: { include_usage: true }
      }),
      signal: ctrl.signal,
      openWhenHidden: true,

      onopen(response) {
        if (response.status !== 200) {
          throw new Error(`API 返回错误状态: ${response.status}`)
        }
      },

      onmessage(event) {
        if (event.data === '[DONE]') {
          finishStream(getReactiveMsg())
          return
        }

        try {
          const chunk = JSON.parse(event.data)
          handleDeepSeekChunk(chunk, getReactiveMsg())
        } catch {
          // 忽略解析错误
        }
      },

      onclose() {
        finishStream(getReactiveMsg())
      },

      onerror(err) {
        console.error('DeepSeek stream error:', err)
        handleStreamError(getReactiveMsg(), err.message)
        throw err // 阻止自动重试
      }
    })
  } catch (err) {
    if (err.name !== 'AbortError') {
      handleStreamError(getReactiveMsg(), err.message)
    }
  }
}

/**
 * 处理 Mock SSE 事件 → 更新 Block
 */
function handleSSEEvent(event, assistantMsg, textBlockRenderedLength) {
  const { event: eventType, data } = event
  let payload
  try {
    payload = typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    payload = {}
  }

  switch (eventType) {
    // ===== 思考 =====
    case 'thinking_start': {
      assistantMsg.blocks.push({
        id: payload.blockId || generateId('block_'),
        type: 'thinking',
        status: 'streaming',
        content: '',
        collapsed: false
      })
      break
    }
    case 'thinking_delta': {
      const block = findBlock(assistantMsg, payload.blockId, 'thinking', 'streaming')
      if (block) block.content += (payload.delta || '')
      break
    }
    case 'thinking_end': {
      const block = findBlock(assistantMsg, payload.blockId, 'thinking', 'streaming')
      if (block) block.status = 'done'
      break
    }

    // ===== 正文文本 =====
    case 'text_delta': {
      let block = assistantMsg.blocks.find(b =>
        b.type === 'text' && b.status === 'streaming'
      )
      if (!block) {
        block = {
          id: payload.blockId || generateId('block_'),
          type: 'text',
          status: 'streaming',
          content: '',
          renderedLength: 0
        }
        assistantMsg.blocks.push(block)
      }
      block.content += (payload.delta || '')
      break
    }

    // ===== 代码块 =====
    case 'code_block_start': {
      // 关闭前一个 text block
      finishLastTextBlock(assistantMsg)

      assistantMsg.blocks.push({
        id: payload.blockId || generateId('block_'),
        type: 'code',
        status: 'streaming',
        language: payload.language || 'plaintext',
        content: ''
      })
      break
    }
    case 'code_delta': {
      const block = findBlock(assistantMsg, payload.blockId, 'code', 'streaming')
      if (block) block.content += (payload.delta || '')
      break
    }
    case 'code_block_end': {
      const block = findBlock(assistantMsg, payload.blockId, 'code', 'streaming')
      if (block) block.status = 'done'
      break
    }

    // ===== 块级公式 =====
    case 'formula_start': {
      finishLastTextBlock(assistantMsg)

      assistantMsg.blocks.push({
        id: payload.blockId || generateId('block_'),
        type: 'formula',
        status: 'streaming',
        formula: '',
        displayMode: true
      })
      break
    }
    case 'formula_delta': {
      const block = findBlock(assistantMsg, payload.blockId, 'formula', 'streaming')
      if (block) block.formula += (payload.delta || '')
      break
    }
    case 'formula_end': {
      const block = findBlock(assistantMsg, payload.blockId, 'formula', 'streaming')
      if (block) block.status = 'done'
      break
    }

    // ===== 思维导图（markdown 文本） =====
    case 'mindmap_start': {
      finishLastTextBlock(assistantMsg)
      assistantMsg.blocks.push({
        id: payload.blockId || generateId('block_'),
        type: 'mindmap',
        status: 'streaming',
        rootTitle: payload.rootTitle || '思维导图',
        markdown: `# ${payload.rootTitle || '思维导图'}\n`
      })
      break
    }
    case 'mindmap_delta': {
      const block = findBlock(assistantMsg, payload.blockId, 'mindmap', 'streaming')
      if (block) block.markdown += (payload.delta || '')
      break
    }
    case 'mindmap_end': {
      const block = findBlock(assistantMsg, payload.blockId, 'mindmap', 'streaming')
      if (block) block.status = 'done'
      break
    }

    // ===== Mermaid 图表 =====
    case 'mermaid_start': {
      finishLastTextBlock(assistantMsg)

      assistantMsg.blocks.push({
        id: payload.blockId || generateId('block_'),
        type: 'mermaid',
        status: 'streaming',
        code: ''
      })
      break
    }
    case 'mermaid_delta': {
      const block = findBlock(assistantMsg, payload.blockId, 'mermaid', 'streaming')
      if (block) block.code += (payload.delta || '')
      break
    }
    case 'mermaid_end': {
      const block = findBlock(assistantMsg, payload.blockId, 'mermaid', 'streaming')
      if (block) block.status = 'done'
      break
    }

    // ===== 消息结束 =====
    case 'message_done': {
      assistantMsg.meta = {
        ...assistantMsg.meta,
        ...(payload.meta || {})
      }
      // 标记所有未完成的 block
      assistantMsg.blocks.forEach(b => {
        if (b.status === 'streaming') b.status = 'done'
      })
      break
    }

    // ===== 错误 =====
    case 'error': {
      assistantMsg.blocks.push({
        id: generateId('block_'),
        type: 'text',
        status: 'done',
        content: `> ⚠️ **错误**：${payload.message || '未知错误'}\n>\n> 错误代码：${payload.code || 'UNKNOWN'}`
      })
      break
    }
  }
}

/**
 * 处理 DeepSeek API SSE chunk
 * DeepSeek 返回标准 OpenAI-compatible 格式：
 * { choices: [{ delta: { role, content, reasoning_content } }], usage: {...} }
 */
function handleDeepSeekChunk(chunk, assistantMsg) {
  // Usage 数据（stream_options.include_usage 开启时的最后 chunk）
  if (chunk.usage && !chunk.choices?.length) {
    assistantMsg.meta.usage = chunk.usage
    return
  }

  const choice = chunk.choices?.[0]
  if (!choice) return

  const delta = choice.delta || {}

  // 处理推理内容（reasoning_content）
  if (delta.reasoning_content) {
    let block = assistantMsg.blocks.find(b =>
      b.type === 'thinking' && b.status === 'streaming'
    )
    if (!block) {
      block = {
        id: generateId('block_'),
        type: 'thinking',
        status: 'streaming',
        content: '',
        collapsed: false
      }
      assistantMsg.blocks.push(block)
    }
    block.content += delta.reasoning_content
  }

  // 处理正文内容（content）
  if (delta.content) {
    // 关闭 thinking block（如果有）
    const thinkingBlock = assistantMsg.blocks.find(b =>
      b.type === 'thinking' && b.status === 'streaming'
    )
    if (thinkingBlock) {
      thinkingBlock.status = 'done'
    }

    let block = assistantMsg.blocks.find(b =>
      b.type === 'text' && b.status === 'streaming'
    )
    if (!block) {
      block = {
        id: generateId('block_'),
        type: 'text',
        status: 'streaming',
        content: '',
        renderedLength: 0
      }
      assistantMsg.blocks.push(block)
    }
    block.content += delta.content
  }

  // 处理 tool_calls（未来扩展）
  if (delta.tool_calls) {
    // 暂不处理，保留扩展点
  }

  // 流结束
  if (choice.finish_reason) {
    assistantMsg.blocks.forEach(b => {
      if (b.status === 'streaming') b.status = 'done'
    })
  }
}

// ===== Block 辅助函数 =====

/**
 * 查找指定类型的 Block（优先按 ID 查找，降级按类型+状态查找）
 */
function findBlock(assistantMsg, blockId, type, status) {
  if (blockId) {
    return assistantMsg.blocks.find(b => b.id === blockId)
  }
  return assistantMsg.blocks.find(b => b.type === type && b.status === status)
}

/**
 * 关闭最后一个 text block 的 streaming 状态
 */
function finishLastTextBlock(assistantMsg) {
  const block = assistantMsg.blocks.find(b =>
    b.type === 'text' && b.status === 'streaming'
  )
  if (block) block.status = 'done'
}

/**
 * 完成流式输出
 */
function finishStream(assistantMsg) {
  isStreaming.value = false
  abortController.value = null
  // 标记所有未完成的 block
  assistantMsg.blocks.forEach(b => {
    if (b.status === 'streaming') b.status = 'done'
  })
}

/**
 * 处理流错误
 */
function handleStreamError(assistantMsg, errorMessage) {
  isStreaming.value = false
  abortController.value = null

  // 关闭正在流式的 block
  assistantMsg.blocks.forEach(b => {
    if (b.status === 'streaming') b.status = 'done'
  })

  // 添加错误提示
  assistantMsg.blocks.push({
    id: generateId('block_'),
    type: 'text',
    status: 'done',
    content: `> ⚠️ **请求失败**：${errorMessage}\n>\n> 请检查网络连接后重试。`
  })
}

// ===== DeepSeek 上下文构建 =====

/**
 * 构建 DeepSeek API 的消息上下文
 */
function buildDeepSeekContext(messages) {
  const result = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content })
    } else if (msg.role === 'assistant') {
      // 拼接所有 text block 的内容
      const fullContent = (msg.blocks || [])
        .filter(b => b.type === 'text' || b.type === 'thinking')
        .map(b => b.content)
        .join('\n')
      if (fullContent) {
        result.push({ role: 'assistant', content: fullContent })
      }
    }
  }

  return result
}

// ===== 操作 =====

/** 停止生成 */
function stopGeneration() {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isStreaming.value = false

  // 关闭正在流式的 block
  const lastMsg = messages.value[messages.value.length - 1]
  if (lastMsg?.role === 'assistant') {
    lastMsg.blocks.forEach(b => {
      if (b.status === 'streaming') b.status = 'done'
    })
    // 添加"已停止"标记
    lastMsg.blocks.push({
      id: generateId('block_'),
      type: 'text',
      status: 'done',
      content: '\n\n---\n> ⏸️ *已停止生成*'
    })
  }
}

/** 重新生成 */
async function regenerate() {
  if (isStreaming.value) return

  // 移除最后一条 assistant 消息
  if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'assistant') {
    messages.value.pop()
  }
  // 移除关联的"已停止"标记（如果存在）
  // 不需要额外处理

  // 重新发送最后一条 user 消息
  const lastUser = lastUserMessage.value
  if (lastUser) {
    await sendMessage(lastUser.content)
  }
}

/** 清空当前对话消息 */
function clearMessages() {
  messages.value = []
  if (currentConversation.value) {
    currentConversation.value._messages = []
  }
}

// ===== 导出 =====

export function useChat() {
  // 初始化：如果没有对话，创建一个
  if (conversations.value.length === 0) {
    createNewConversation()
  }
  if (!currentConversationId.value && conversations.value.length > 0) {
    switchConversation(conversations.value[0].id)
  }

  return {
    // 状态
    conversations,
    currentConversationId,
    currentConversation,
    messages,
    isStreaming,
    lastUserMessage,

    // 对话操作
    createNewConversation,
    switchConversation,
    deleteConversation,

    // 消息操作
    sendMessage,
    stopGeneration,
    regenerate,
    clearMessages
  }
}
