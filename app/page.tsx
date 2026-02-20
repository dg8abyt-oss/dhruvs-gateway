"use client";

import { useState } from "react";

// 1. Reusable CodeBlock component with a Copy Button
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="relative my-6 rounded-lg bg-gray-900 border border-gray-800 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-800">
        <span className="text-xs font-mono text-gray-400">{language}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none"
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// 2. The Main Documentation Page
export default function GatewayDocs() {
  return (
    <main className="min-h-screen bg-black text-gray-100 py-16 px-6 sm:px-12 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Dhruvs AI Gateway
          </h1>
          <p className="text-lg text-gray-400">
            Connect any website to world-class AI models using a single script tag. 
            No API keys required on the client, and no complex backend setup.
          </p>
        </header>

        {/* Quick Start Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-200 mb-2">
              1. Control the AI's Personality
            </h3>
            <p className="text-gray-400 mb-2">
              Create a <code className="bg-gray-800 px-1 rounded text-gray-200">prompt.txt</code> file at the root of your website. This file will strictly control the AI.
            </p>
            <CodeBlock 
              language="prompt.txt" 
              code={`You are a helpful and sarcastic AI assistant. Keep your answers brief.`} 
            />
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-200 mb-2">
              2. Embed the Script
            </h3>
            <p className="text-gray-400 mb-2">
              Add this script tag to your HTML file.
            </p>
            <CodeBlock 
              language="html" 
              code={`<script src="https://gateway.dhruvs.host/widget.js" defer></script>`} 
            />
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-200 mb-2">
              3. Call the AI
            </h3>
            <p className="text-gray-400 mb-2">
              Use the global function anywhere in your Javascript to interact with the gateway.
            </p>
            <CodeBlock 
              language="javascript" 
              code={`async function runAI() {\n  const reply = await window.dhruvs(\n    "gateway-call", \n    "Hello world!", \n    "openai/gpt-4o" // Pass the model ID here\n  );\n  console.log(reply);\n}`} 
            />
          </div>
        </section>

        {/* Supported Models Section */}
        <section>
          <h2 className="text-2xl font-semibold text-white mb-4">Supported Models</h2>
          <p className="text-gray-400 mb-4">
            Pass any of the following strings as the third argument to the <code className="bg-gray-800 px-1 rounded text-gray-200">dhruvs()</code> function.
          </p>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-950 border-b border-gray-800">
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">Provider</th>
                  <th className="py-3 px-4 text-sm font-medium text-gray-300">Model ID String</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-400">
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium text-gray-200">OpenAI</td>
                  <td className="py-3 px-4 font-mono">openai/gpt-4o</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium text-gray-200">Anthropic</td>
                  <td className="py-3 px-4 font-mono">anthropic/claude-3-5-sonnet-20240620</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-200">Google</td>
                  <td className="py-3 px-4 font-mono">google/gemini-1.5-pro</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
