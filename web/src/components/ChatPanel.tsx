"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  onYamlGenerated: (yaml: string) => void;
  currentYaml?: string;
  selectionContext?: {
    label: string;
    element: unknown;
  } | null;
}

const AI_GUIDE_URL = "https://github.com/jacobjiangwei/newPNG/blob/main/spec/AI_GENERATION_GUIDE.md";
const FORMAT_SPEC_URL = "https://github.com/jacobjiangwei/newPNG/blob/main/spec/npng-v3.md";

export default function ChatPanel({ onYamlGenerated, currentYaml, selectionContext }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      const userMsg: Message = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            currentYaml,
            selectionContext,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Error: ${err}` },
          ]);
          setLoading(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let assistantText = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "assistant", content: assistantText };
            return copy;
          });
        }

        // Extract YAML from response
        const yamlMatch = assistantText.match(/```(?:yaml|npng)?\s*\n([\s\S]*?)\n```/);
        if (yamlMatch) {
          onYamlGenerated(yamlMatch[1]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${message}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, onYamlGenerated, currentYaml, selectionContext]
  );

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-700 px-3 py-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-zinc-300">Text-to-Design AI</div>
          <div className="text-[10px] text-zinc-500">Generates editable npng source</div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[10px] font-medium">
          <a
            href={AI_GUIDE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-blue-300 hover:text-blue-200"
          >
            AI guide
          </a>
          <span className="text-zinc-600">/</span>
          <a
            href={FORMAT_SPEC_URL}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-zinc-200"
          >
            Spec
          </a>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2 text-sm">
            <p className="text-zinc-300 font-medium">
              {selectionContext ? "Edit the selected object with AI." : "Generate editable design source, not a flat bitmap."}
            </p>
            <p className="text-zinc-500">
              {selectionContext
                ? `Selected: ${selectionContext.label}. Ask for a local change like "make it glassy" or "turn this into a blue gradient button".`
                : "Ask for a poster, card, icon, product mockup, or visual system. Claude returns npng YAML that stays editable and exports sharply at any scale."}
            </p>
            <p className="text-zinc-600 text-xs">
              Try: &quot;Design a glassmorphism launch card for an AI design tool.&quot;
            </p>
            <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-2 text-xs text-zinc-500">
              Agents should return full <span className="font-mono text-zinc-300">npng: &quot;0.3&quot;</span>{" "}
              YAML with layers, editable text, stable IDs, and named objects.{" "}
              <a
                href={AI_GUIDE_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-300 hover:text-blue-200"
              >
                Read the generation rules
              </a>
              .
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm whitespace-pre-wrap ${
              msg.role === "user" ? "text-blue-300" : "text-zinc-300"
            }`}
          >
            <span className="font-bold text-xs text-zinc-500">
              {msg.role === "user" ? "You" : "Claude"}:{" "}
            </span>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="text-zinc-500 text-sm animate-pulse">Thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-2 border-t border-zinc-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectionContext ? "Describe how to change the selection..." : "Describe the design you want..."}
          className="flex-1 bg-zinc-800 text-zinc-200 px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50 hover:bg-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
}
