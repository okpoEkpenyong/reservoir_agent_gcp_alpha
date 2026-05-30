/* const BASE = import.meta.env.VITE_API_URL ?? '' */

const BASE = 'http://localhost:8001';

export interface ChatResponse {
  response: string;
  session_id: string;
}

export async function sendChatMessage(prompt: string, sessionId?: string): Promise<ChatResponse> {
  // Use URLSearchParams to send as application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('prompt', prompt);
  if (sessionId) {
    params.append('session_id', sessionId);
  }

  const response = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail?.[0]?.msg || 'Failed to communicate with reservoir agent');
  }

  return response.json();
}



export async function* streamMessage(
  message: string,
  sessionId?: string
): AsyncGenerator<{ type: string; text?: string; final?: boolean; author?: string; session_id?: string }> {
  const res = await fetch(`${BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
  if (!res.ok) throw new Error(`Stream error ${res.status}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try { yield JSON.parse(line.slice(6)) } catch {}
      }
    }
  }
}

export async function getInfo() {
  const res = await fetch(`${BASE}/info`)
  if (!res.ok) throw new Error('Cannot reach backend')
  return res.json()
}
