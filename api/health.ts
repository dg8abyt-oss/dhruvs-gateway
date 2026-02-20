import { generateText, gateway } from 'ai';

export const config = {
  runtime: 'edge', 
};

export default async function handler(req: Request) {
  // Only allow GET requests for the health check
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // Ping gpt-5-mini to ensure the gateway and API keys are working
    const { text } = await generateText({
      model: gateway('openai/gpt-5-mini'), 
      system: "You are a diagnostic tool. Reply with exactly: 'OK - Systems Operational'.", 
      prompt: "Status check."
    });

    // Return a healthy JSON response with the AI's exact message
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
    
    // Return an unhealthy JSON response if the AI fails to connect
    return new Response(JSON.stringify({ 
      status: 'unhealthy', 
      error: error.message || 'Gateway Connection Failed' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
