import type { IncomingMessage, ServerResponse } from 'node:http';

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  // Vercel may pre-parse the body and attach it to req; use it if present
  const preparsed = (req as IncomingMessage & { body?: unknown }).body;
  if (preparsed !== undefined) {
    console.log('[generate] Using pre-parsed body from Vercel');
    return preparsed;
  }

  // Fall back to reading the raw stream and parsing JSON manually
  console.log('[generate] Reading body from stream');
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error(`JSON parse error: ${String(e)}`));
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  console.log(`[generate] invoked method=${req.method} url=${req.url}`);

  try {
    if (req.method !== 'POST') {
      console.log(`[generate] rejected method=${req.method}`);
      sendJSON(res, 405, { error: 'Method not allowed' });
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log(`[generate] ANTHROPIC_API_KEY present=${Boolean(apiKey)} length=${apiKey?.length ?? 0}`);
    if (!apiKey) {
      console.error('[generate] ANTHROPIC_API_KEY is not set — add it to Vercel environment variables');
      sendJSON(res, 500, { error: 'ANTHROPIC_API_KEY is not configured on the server' });
      return;
    }

    let body: unknown;
    try {
      body = await readBody(req);
      console.log('[generate] body parsed ok, type=', typeof body);
    } catch (err) {
      console.error('[generate] body parse failed:', err);
      sendJSON(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const b = (body ?? {}) as { model?: string; messages?: Array<{ role: string; content: string }>; system?: string };
    const { model = 'claude-sonnet-4-6', messages, system } = b;

    if (!messages?.length) {
      console.error('[generate] messages missing or empty');
      sendJSON(res, 400, { error: 'messages is required' });
      return;
    }

    console.log(`[generate] calling Anthropic model=${model} messages=${messages.length}`);
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 8192, system, messages }),
    });

    console.log(`[generate] Anthropic responded status=${upstream.status}`);
    const data = await upstream.json();
    sendJSON(res, upstream.status, data);
  } catch (err) {
    console.error('[generate] unhandled error:', err);
    sendJSON(res, 500, { error: err instanceof Error ? err.message : 'Internal server error' });
  }
}
