(function(window) {
  const GATEWAY_URL = "https://gateway.dhruvs.host/api/gateway";

  // 1. Check the domain immediately when the script loads
  const currentDomain = window.location.hostname;
  const isValid = currentDomain === "dhruvs.host" || 
                  currentDomain.endsWith(".dhruvs.host") || 
                  currentDomain === "localhost"; // Left localhost so you can test locally

  // If they aren't on your domain, yell at them in the console
  if (!isValid) {
    console.error("This domain is not authorized to use the Dhruv Gowda/Alibaba Gateway");
  }

  async function gatewayCall(message, model) {
    // Prevent the function from even running if it's the wrong domain
    if (!isValid) {
      console.error("This domain is not authorized to use the Dhruv Gowda/Alibaba Gateway");
      return "Error: Unauthorized domain.";
    }

    try {
      const promptReq = await fetch('/prompt.txt');
      if (!promptReq.ok) console.warn("DhruvsAI: /prompt.txt not found.");
      const systemPrompt = promptReq.ok ? await promptReq.text() : "";

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, systemPrompt: systemPrompt.trim(), model })
      });

      if (!res.body) return "Error: No response from gateway.";

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
    } catch (err) {
      console.error("Gateway Error:", err);
      return "Error contacting gateway.";
    }
  }

  window.dhruvs = (action, payload, model) => {
    if (action === "gateway-call") return gatewayCall(payload, model);
  };
})(window);
