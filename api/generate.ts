import type { IncomingMessage, ServerResponse } from 'node:http';

interface ClaudeBody {
  model?: string;
  messages?: Array<{ role: string; content: string }>;
  system?: string;
}

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export default async function handler(
  req: IncomingMessage & { body: ClaudeBody },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    sendJSON(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    sendJSON(res, 500, { error: 'ANTHROPIC_API_KEY is not configured on the server' });
    return;
  }

  const { model = 'claude-sonnet-4-6', messages, system } = req.body ?? {};

  if (!messages?.length) {
    sendJSON(res, 400, { error: 'messages is required' });
    return;
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 8192, system, messages }),
    });

    const data = await upstream.json();
    sendJSON(res, upstream.status, data);
  } catch (err) {
    sendJSON(res, 500, { error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
