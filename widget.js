(function(window) {
  // Points to your new serverless function
  const GATEWAY_URL = "https://gateway.dhruvs.host/api/gateway";

  async function gatewayCall(message, model) {
    // 1. SYSTEM PROMPT LOGIC:
    // Looks for a prompt.txt file at the root of the USER'S website
    const promptReq = await fetch('/prompt.txt');
    if (!promptReq.ok) {
      console.warn("DhruvsAI: /prompt.txt not found. Using default instructions.");
    }
    const systemPrompt = promptReq.ok ? await promptReq.text() : "";

    // 2. MODEL CHANGER LOGIC:
    // Sends the user's message, their prompt, and their chosen model to your backend
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: message, 
        systemPrompt: systemPrompt.trim(), 
        model: model 
      })
    });

    if (!res.body) return "Error: No response from gateway.";

    // 3. STREAM DECODER:
    // Cleans up the raw data stream coming from Vercel's AI SDK
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      text += chunk.replace(/^0:"|"$|\\n/gm, (m) => m === '\\n' ? '\n' : '');
    }
    return text.replace(/\\"/g, '"');
  }

  // Bind it to the global window object so anyone can call it
  window.dhruvs = (action, payload, model) => {
    if (action === "gateway-call") return gatewayCall(payload, model);
  };
})(window);
