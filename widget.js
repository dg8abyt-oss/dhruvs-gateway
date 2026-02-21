(function(window) {
  const GATEWAY_URL = "https://gateway.dhruvs.host/api/gateway";

  const currentDomain = window.location.hostname;
  const isValid = currentDomain === "dhruvs.host" || 
                  currentDomain.endsWith(".dhruvs.host") || 
                  currentDomain === "localhost"; 

  if (!isValid) console.error("use dhruvs.host domain");

  // Removed systemPrompt argument
  async function gatewayCall(message, model, showThinking = false) {
    if (!isValid) {
      console.error("use dhruvs.host domain");
      return "Error: Unauthorized domain.";
    }

    try {
      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sending a much lighter payload
        body: JSON.stringify({ message, model, showThinking })
      });

      if (!res.body) return "Error: No response from gateway.";

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let text = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); 

        for (const line of lines) {
          if (!line) continue;

          if (line.startsWith('0:')) {
            text += JSON.parse(line.substring(2));
          } 
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

  window.dhruvs = (action, payload, model, showThinking) => {
    if (action === "gateway-call") return gatewayCall(payload, model, showThinking);
  };
})(window);
