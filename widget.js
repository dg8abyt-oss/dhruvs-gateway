(function(window) {
  const GATEWAY_URL = "https://gateway.dhruvs.host/api/gateway";

  const currentDomain = window.location.hostname;
  const isValid = currentDomain === "dhruvs.host" || 
                  currentDomain.endsWith(".dhruvs.host") || 
                  currentDomain === "localhost"; 

  if (!isValid) console.error("use dhruvs.host domain");

  // ADDED: showThinking parameter (defaults to false)
  async function gatewayCall(message, model, showThinking = false) {
    if (!isValid) {
      console.error("use dhruvs.host domain");
      return "Error: Unauthorized domain.";
    }

    try {
      const promptReq = await fetch('/prompt.txt');
      const systemPrompt = promptReq.ok ? await promptReq.text() : "";

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass the toggle to the backend
        body: JSON.stringify({ message, systemPrompt: systemPrompt.trim(), model, showThinking })
      });

      if (!res.body) return "Error: No response from gateway.";

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let text = "";
      let buffer = "";

      // PROPER VERCEL STREAM PARSING
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer for the next chunk
        buffer = lines.pop(); 

        for (const line of lines) {
          if (!line) continue;

          // 0: is standard text
          if (line.startsWith('0:')) {
            text += JSON.parse(line.substring(2));
          } 
          // 8: is native reasoning (like DeepSeek R1). Only add it if toggled ON.
          else if (line.startsWith('8:') && showThinking) {
            text += `\n💭 *${JSON.parse(line.substring(2))}*\n`;
          }
        }
      }
      
      return text;
    } catch (err) {
      console.error("Gateway Error:", err);
      return "Error contacting gateway.";
    }
  }

  // Bind the toggle to the global function
  window.dhruvs = (action, payload, model, showThinking) => {
    if (action === "gateway-call") return gatewayCall(payload, model, showThinking);
  };
})(window);
