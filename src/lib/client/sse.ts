export interface SseEvent {
  event: string
  data: unknown
}

/**
 * Reads a fetch() Response as an SSE stream, invoking onEvent per event.
 *
 * Dependency-free on purpose: EventSource cannot issue a POST, and the whole
 * protocol is a few lines. Frames with no `data:` line (our `: keepalive`
 * comments) are skipped for free.
 */
export async function readSse(res: Response, onEvent: (e: SseEvent) => void): Promise<void> {
  if (!res.body) throw new Error('Response has no body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })

    // Tolerate \r\n\r\n as well, in case a proxy rewrites line endings.
    let idx: number
    while ((idx = findFrameEnd(buf)) >= 0) {
      const chunk = buf.slice(0, idx)
      buf = buf.slice(idx + (buf.startsWith('\r\n\r\n', idx) ? 4 : 2))

      let event = 'message'
      const dataLines: string[] = []
      for (const line of chunk.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
      }
      if (dataLines.length > 0) {
        try {
          onEvent({ event, data: JSON.parse(dataLines.join('\n')) })
        } catch {
          // malformed frame -- skip rather than tear down the stream
        }
      }
    }
  }
}

function findFrameEnd(buf: string): number {
  const a = buf.indexOf('\n\n')
  const b = buf.indexOf('\r\n\r\n')
  if (a === -1) return b
  if (b === -1) return a
  return Math.min(a, b)
}
