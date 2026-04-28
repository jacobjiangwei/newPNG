"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import yaml from "js-yaml";
import { decodeNpngShare, encodeNpngShare, readNpngSharePayload } from "../../lib/npngShare";
import { preloadNpngImages, renderNpng } from "../../lib/renderer";
import type { NpngDocument } from "../../lib/types";

const SAMPLE_NPNG = `npng: "0.3"
canvas:
  width: 720
  height: 420
  background: "#0B1020"
layers:
  - name: viewer sample
    elements:
      - type: rect
        x: 64
        y: 64
        width: 592
        height: 292
        rx: 28
        ry: 28
        fill:
          type: linear-gradient
          x1: 64
          y1: 64
          x2: 656
          y2: 356
          stops:
            - offset: 0
              color: "#2563EB"
            - offset: 1
              color: "#D946EF"
      - type: text
        x: 112
        y: 182
        width: 496
        content: "Drop, paste, or open shared npng source."
        font_size: 34
        font_weight: bold
        line_height: 1.1
        fill: "#FFFFFF"
`;

export default function NpngViewerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [yamlText, setYamlText] = useState(SAMPLE_NPNG);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      const doc = yaml.load(yamlText) as NpngDocument;
      if (!doc || typeof doc !== "object") return { doc: null, error: "Source is not a YAML object." };
      return { doc, error: null };
    } catch (error) {
      return { doc: null, error: error instanceof Error ? error.message : "Invalid npng YAML." };
    }
  }, [yamlText]);

  const sharePayload = useMemo(() => encodeNpngShare(yamlText), [yamlText]);
  const studioHref = `/editing#npng=${sharePayload}`;

  useEffect(() => {
    const payload = readNpngSharePayload(window.location.search, window.location.hash);
    if (!payload) return;
    let nextYaml: string;
    try {
      nextYaml = decodeNpngShare(payload);
    } catch (error) {
      console.error(error);
      const timer = window.setTimeout(() => setLoadMessage("Could not decode the shared npng URL."), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setYamlText(nextYaml);
      setLoadMessage("Loaded shared npng source from the URL.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !parsed.doc) return;
    let cancelled = false;
    async function render() {
      try {
        await preloadNpngImages(parsed.doc!);
        if (cancelled || !canvasRef.current) return;
        renderNpng(parsed.doc!, canvasRef.current, { pixelRatio: Math.min(4, window.devicePixelRatio || 1) });
        canvasRef.current.style.width = `${parsed.doc!.canvas?.width ?? 800}px`;
        canvasRef.current.style.height = `${parsed.doc!.canvas?.height ?? 600}px`;
      } catch (error) {
        console.error(error);
        setLoadMessage("The npng source parsed, but one or more image assets could not render.");
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [parsed.doc]);

  const handleFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setYamlText(String(reader.result ?? ""));
      setLoadMessage(`Loaded ${file.name}.`);
    };
    reader.onerror = () => setLoadMessage(`Could not read ${file.name}.`);
    reader.readAsText(file);
    event.target.value = "";
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    const url = `${window.location.origin}/viewer#npng=${sharePayload}`;
    try {
      await navigator.clipboard.writeText(url);
      setLoadMessage("Viewer share link copied.");
    } catch (error) {
      console.error(error);
      setLoadMessage(url);
    }
  }, [sharePayload]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([yamlText], { type: "text/yaml" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "design.npng";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }, [yamlText]);

  return (
    <main className="flex min-h-screen flex-col bg-[#111111] text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 bg-[#181818] px-5 py-3">
        <div>
          <div className="text-sm font-bold tracking-[0.2em]">NewPNG Viewer</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70">Online .npng preview and sharing</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={studioHref} className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">
            Edit in Studio
          </Link>
          <Link href="/" className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">
            Home
          </Link>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[360px_1fr] overflow-hidden">
        <aside className="flex min-h-0 flex-col border-r border-zinc-800 bg-[#202020]">
          <div className="border-b border-zinc-800 p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Open .npng
              </button>
              <button
                onClick={handleDownload}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
              >
                Download
              </button>
              <button
                onClick={handleCopyShareLink}
                className="col-span-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Copy viewer share link
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".npng,.yaml,.yml,text/yaml,text/plain" className="hidden" onChange={handleFile} />
            {loadMessage && <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-400">{loadMessage}</div>}
            {parsed.error && <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[11px] text-red-200">{parsed.error}</div>}
          </div>
          <textarea
            value={yamlText}
            onChange={(event) => setYamlText(event.target.value)}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-[#10131c] p-4 font-mono text-[11px] leading-5 text-zinc-300 outline-none"
          />
        </aside>

        <section className="min-h-0 overflow-auto bg-[#171717] p-8">
          <div className="mx-auto inline-block rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl">
            <canvas ref={canvasRef} className="block max-h-[calc(100vh-140px)] max-w-[calc(100vw-470px)] object-contain" />
          </div>
        </section>
      </div>
    </main>
  );
}
