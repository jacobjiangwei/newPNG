import type { ElementAddress } from "./editorState";
import type { NpngDocument, NpngElement } from "./types";

function truncate(value: string, maxLength = 28): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export function getElementTypeLabel(element: NpngElement): string {
  const labels: Record<string, string> = {
    rect: "Rectangle",
    ellipse: "Ellipse",
    line: "Line",
    text: "Text",
    path: "Vector",
    group: "Group",
    boolean: "Boolean",
    use: "Instance",
    image: "Image",
    frame: "Frame",
    "component-instance": "Component",
  };
  return labels[element.type] ?? element.type;
}

export function getElementShortLabel(element: NpngElement, elementIndex: number): string {
  const typeLabel = getElementTypeLabel(element);
  if (element.name?.trim()) {
    return `${truncate(element.name.trim())} (${typeLabel})`;
  }
  if (element.type === "text") {
    const text = element.content || element.spans?.map((span) => span.text).join("") || "Text";
    return `Text "${truncate(text, 20)}" #${elementIndex + 1}`;
  }
  return `${typeLabel} #${elementIndex + 1}`;
}

export function getElementDisplayName(doc: NpngDocument, address: ElementAddress): string {
  const layer = doc.layers?.[address.layerIndex];
  const element = layer?.elements?.[address.elementIndex];
  const layerName = layer?.name || `Layer ${address.layerIndex + 1}`;
  if (!element) return `${layerName} / missing #${address.elementIndex + 1}`;
  return `${layerName} / ${getElementShortLabel(element, address.elementIndex)}`;
}
