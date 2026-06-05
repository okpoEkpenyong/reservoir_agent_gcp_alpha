// src/services/api.ts

//const BASE = 'http://localhost:8001';
const isProd = import.meta.env.PROD;
// In production, use empty string (relative). In dev, use 8001.
const BASE = isProd ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8001');

export interface ChatResponse {
  response: string;
  session_id: string;
  model_id: string;
}

export async function sendChatMessage(
  prompt: string, 
  modelId: string = "gemini-2.5-flash",
  signal?: AbortSignal,
  sessionId?: string): Promise<ChatResponse> {
  // Use URLSearchParams to send as application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('prompt', prompt);
  params.append('model_id', modelId); // Send to backend
  if (sessionId) params.append('session_id', sessionId);

  const response = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: params,
	signal: signal, // Connects the signal to the fetch request
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to communicate with reservoir agent');
  }

  return response.json();
}


export async function runBulkDCA(productionData: any[], econLimit: number) {
  const response = await fetch(`${BASE}/api/tools/asset-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
	//headers: {
    //  'Content-Type': 'application/x-www-form-urlencoded',
    //  'Accept': 'application/json',
    //},
	
    body: JSON.stringify({
      records: productionData,
      econ_limit: econLimit
    }),
  });
  if (!response.ok) throw new Error('DCA Analysis Failed');
  return response.json();
}

export async function getInfo() {
  const res = await fetch(`${BASE}/info`)
  if (!res.ok) throw new Error('Cannot reach backend')
  return res.json()
}
