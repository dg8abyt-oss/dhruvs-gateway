import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 1. Initialize the Gateway Client
// This uses the OpenAI SDK format but points entirely to Vercel's Gateway
const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY, 
  baseURL: "https://ai-gateway.vercel.sh/v1"
});

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  
  const headers = {
    'Access-Control-Allow-Origin': origin || '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { message, systemPrompt, model } = await req.json();

    // Default to a fast model if the user forgets to pass one
    const selectedModel = model || 'openai/gpt-4o-mini'; 

    // 2. Call the AI through the unified Vercel Gateway
    const result = await streamText({
      model: gateway(selectedModel), 
      system: systemPrompt || "You are a helpful assistant.", 
      messages: [{ role: 'user', content: message }],
    });

    // 3. Stream back to the user's website
    return result.toDataStreamResponse({ headers });
    
  } catch (error) {
    console.error("Gateway Error:", error);
    return new Response(JSON.stringify({ error: 'Gateway Error' }), { 
      status: 500, 
      headers 
    });
  }
}
