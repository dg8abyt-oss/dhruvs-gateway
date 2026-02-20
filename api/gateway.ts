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
    // Logs to your Vercel dashboard exactly as you asked
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
    const { message, systemPrompt, model } = await req.json();

    const result = await streamText({
      model: gatewayProvider(model), 
      system: systemPrompt || "You are a helpful assistant.", 
      messages: [{ role: 'user', content: message }],
    });

    return result.toDataStreamResponse({ headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
}
