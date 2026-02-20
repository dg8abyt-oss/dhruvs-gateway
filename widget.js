(function(window) {
  const HOST_DOMAIN = "https://dhruvs.host";

  async function gatewayCall(userMessage, modelName) {
    try {
      // 1. Fetch the user's root system prompt
      const promptResponse = await fetch('/prompt.txt');
      if (!promptResponse.ok) {
        console.warn("DhruvsAI: /prompt.txt not found. Using default instructions.");
      }
      const systemPrompt = promptResponse.ok ? await promptResponse.text() : "";

      // 2. Hit your Vercel Gateway API
      const response = await fetch(`${HOST_DOMAIN}/api/gateway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          systemPrompt: systemPrompt.trim(),
          model: modelName // e.g., "anthropic/claude-sonnet-4.5"
        })
      });

      if (!response.body) throw new Error("No response body");

      // 3. Decode the Vercel AI SDK text stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Clean Vercel AI SDK stream artifacts
        const cleanText = chunk.replace(/^0:"|"$|\\n/gm, (match) => match === '\\n' ? '\n' : '');
        fullResponse += cleanText; 
      }
      
      return fullResponse.replace(/\\"/g, '"');

    } catch (error) {
      console.error("DhruvsAI Error:", error);
      return "Error contacting gateway.";
    }
  }

  // 4. Bind to global window object
  window.dhruvs = async function(action, payload, modelName) {
    if (action === "gateway-call") {
      return await gatewayCall(payload, modelName);
    }
  };

})(window);
