/**
 * SSE 事件流模拟器
 * 用法：const stream = createMockSSEStream(mockData); await stream.start(onopen, onmessage, onclose, onerror)
 */
export function createMockSSEStream(mockData, options = {}) {
  const { mindmapInterval = 400, mermaidDelay = 500 } = options
  let aborted = false
  const controller = { abort: () => { aborted = true } }

  const stream = {
    controller,
    async start(onopen, onmessage, onclose, onerror) {
      await delay(100 + Math.random() * 200)
      if (aborted) return
      if (onopen) { try { onopen({ status: 200, statusText: 'OK', headers: new Map([['content-type', 'text/event-stream']]) }) } catch (_) {} }

      try {
        for (const event of mockData.events) {
          if (aborted) break
          const etype = event.type

          if (isDelta(etype) && event.data.delta) {
            const sz = chunkSize(etype)
            const text = event.data.delta || ''
            for (let i = 0; i < text.length; i += sz) {
              if (aborted) break
              await delay(chunkDelay(etype))
              const chunk = text.slice(i, i + sz)
              if (onmessage) { try { onmessage({ event: etype, data: JSON.stringify({ ...event.data, delta: chunk }) }) } catch (_) {} }
            }
          } else {
            await delay(evtDelay(event, { mindmapInterval, mermaidDelay }))
            if (aborted) break
            if (onmessage) { try { onmessage({ event: etype, data: JSON.stringify(event.data) }) } catch (_) {} }
          }
        }
      } catch (err) { if (onerror && !aborted) { try { onerror(err) } catch (_) {} } return }

      if (onclose && !aborted) { try { onclose() } catch (_) {} }
    }
  }
  return stream
}

// === helpers ===
function isDelta(t) { return /_delta$/.test(t) }
function delay(ms) { return new Promise(r => setTimeout(r, Math.min(ms, 2000))) }

function chunkSize(t) {
  switch (t) {
    case 'thinking_delta': return 3
    case 'text_delta':     return 4
    case 'code_delta':     return 15
    case 'formula_delta':  return 5
    case 'mermaid_delta':  return 15
    default:               return 5
  }
}

function chunkDelay(t) {
  switch (t) {
    case 'thinking_delta': return 30
    case 'text_delta':     return 22
    case 'code_delta':     return 12
    case 'formula_delta':  return 18
    case 'mermaid_delta':  return 30
    default:               return 15
  }
}

function evtDelay(event, s) {
  switch (event.type) {
    case 'thinking_start': case 'thinking_end': return 50
    case 'code_block_start': case 'code_block_end': return 100
    case 'formula_start': return 80; case 'formula_end': return 50
    case 'mindmap_start': return 200; case 'mindmap_end': return 100
    case 'mindmap_node': return s.mindmapInterval
    case 'mermaid_start': return s.mermaidDelay; case 'mermaid_end': return 150
    case 'message_done': return 50
    default: return 30
  }
}

export function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`
}

export function wrapMockResponse(events, meta = {}) {
  const messageId = generateId('msg_')
  return { messageId, events: events.map(e => ({ ...e, data: { messageId, ...e.data } })), meta }
}
