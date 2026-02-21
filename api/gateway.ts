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

    let systemPrompt = "You are a helpful assistant.";
    
    // --- NEW LOGGING & PROTECTION LOGIC ---
    if (origin) {
      const promptUrl = `${origin}/prompt.txt`;
      console.log(`[Gateway] Attempting to fetch prompt from: ${promptUrl}`);
      
      try {
        const promptRes = await fetch(promptUrl);
        
        if (promptRes.ok) {
          const text = await promptRes.text();
          
          // Protect against Vercel returning an HTML 404 page
          if (text.trim().startsWith('<')) {
            console.error(`[Gateway] ERROR: Fetched file looks like an HTML page. Falling back to default.`);
          } else if (text.trim()) {
            systemPrompt = text.trim();
            console.log(`[Gateway] SUCCESS: Loaded custom prompt: "${systemPrompt.substring(0, 40)}..."`);
          }
        } else {
          console.warn(`[Gateway] WARNING: /prompt.txt returned status ${promptRes.status}.`);
        }
      } catch (err: any) {
        console.error(`[Gateway] FETCH FAILED: ${err.message}`);
      }
    } else {
      console.warn(`[Gateway] WARNING: No origin header found in request.`);
    }

    const result = await streamText({
      model: gatewayProvider(model), 
      system: systemPrompt, 
      messages: [{ role: 'user', content: message }],
    });

    return result.toDataStreamResponse({ headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
}
