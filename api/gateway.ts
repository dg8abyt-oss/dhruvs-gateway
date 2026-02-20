import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const config = {
  runtime: 'edge', 
};

const gatewayProvider = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1'
});

// --- SECURITY PROTOCOL ---
// This function checks if the request is actually coming from your domain
function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  
  // Allow localhost for your own local testing
  if (origin.startsWith('http://localhost:')) return true;
  
  try {
    const url = new URL(origin);
    // Returns true ONLY if the domain is exactly dhruvs.host OR ends with .dhruvs.host (subdomains)
    return url.hostname === 'dhruvs.host' || url.hostname.endsWith('.dhruvs.host');
  } catch (e) {
    return false; // Reject if it's a malformed URL
  }
}

export default async function handler(req: Request) {
  // 1. Grab where the request is coming from
  const origin = req.headers.get('origin');

  // 2. ENFORCE DOMAIN SECURITY
  if (!isAllowedOrigin(origin)) {
    console.warn(`BLOCKED Unauthorized attempt from: ${origin}`);
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Domain' }), { 
      status: 403, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // 3. Set strict CORS (Notice we use the actual verified origin now, NOT '*')
  const headers = {
    'Access-Control-Allow-Origin': origin as string, 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight checks from browsers
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
