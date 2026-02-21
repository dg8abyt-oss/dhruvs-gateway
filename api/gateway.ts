import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const config = {
  runtime: 'edge', 
};

const gatewayProvider = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1'
});

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (origin.startsWith('http://localhost:')) return true;
  try {
    const url = new URL(origin);
    return url.hostname === 'dhruvs.host' || url.hostname.endsWith('.dhruvs.host');
  } catch (e) {
    return false;
  }
}

export default async function handler(req: Request) {
  const origin = req.headers.get('origin');

  if (!isAllowedOrigin(origin)) {
    console.error("use dhruvs.host domain"); 
    return new Response(JSON.stringify({ error: 'use dhruvs.host domain' }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const headers = {
    'Access-Control-Allow-Origin': origin as string, 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  try {
    const { message, model, showThinking } = await req.json();
    
    // 1. NO HARDCODED FALLBACK. It starts undefined.
    let systemPrompt = undefined;
    
    if (origin) {
      const promptUrl = `${origin}/prompt.txt`;
      console.log(`[Gateway] Fetching prompt from: ${promptUrl}`);
      
      try {
        const promptRes = await fetch(promptUrl);
        if (promptRes.ok) {
          const text = await promptRes.text();
          
          if (text.trim().startsWith('<')) {
            console.error(`[Gateway] ERROR: Fetched file is HTML. Proceeding with NO system prompt.`);
          } else if (text.trim()) {
            // 2. Only assigns it if it's actual text
            systemPrompt = text.trim();
            console.log(`[Gateway] SUCCESS: Loaded prompt: "${systemPrompt.substring(0, 40)}..."`);
          }
        } else {
          console.warn(`[Gateway] WARNING: /prompt.txt returned status ${promptRes.status}. Proceeding with NO system prompt.`);
        }
      } catch (err: any) {
        console.error(`[Gateway] FETCH FAILED: ${err.message}`);
      }
    }

    const result = await streamText({
      model: gatewayProvider(model), 
      // 3. Only pass the 'system' parameter if the user actually provided one
      ...(systemPrompt && { system: systemPrompt }), 
      messages: [{ role: 'user', content: message }],
      onFinish: ({ text, finishReason, usage }) => {
        console.log(`[AI Status] Finished. Reason: ${finishReason}`);
        console.log(`[AI Status] Tokens Used: ${usage.totalTokens}`);
        if (!text || text.trim() === "") {
          console.error("[AI Status] CRITICAL: The AI returned an empty string.");
        }
      }
    });

    return result.toDataStreamResponse({ headers });
  } catch (error: any) {
    console.error(`[Gateway] SERVER ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
