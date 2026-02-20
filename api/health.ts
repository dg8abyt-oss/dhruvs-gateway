import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const config = {
  runtime: 'edge', 
};

// 1. Point the OpenAI SDK at your Vercel Gateway
const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1'
});

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 2. Call gpt-5-mini via the gateway
    const { text } = await generateText({
      model: gateway('openai/gpt-5-mini'), 
      system: "You are a diagnostic tool. Reply with exactly: 'OK - Systems Operational'.", 
      prompt: "Status check."
    });

    return new Response(JSON.stringify({ 
      status: 'healthy', 
      model_tested: 'gpt-5-mini',
      ai_response: text 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error: any) {
    console.error("Health Check Failed:", error);
    return new Response(JSON.stringify({ 
      status: 'unhealthy', 
      error: error.message || 'Gateway Connection Failed' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
