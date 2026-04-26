import type { ElementAddress } from "./editorState";
import type { NpngDocument, NpngElement } from "./types";

function truncate(value: string, maxLength = 28): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

export function getElementShortLabel(element: NpngElement, elementIndex: number): string {
  if (element.type === "text") {
    const text = element.content || element.spans?.map((span) => span.text).join("") || "Text";
    return `text "${truncate(text, 20)}" #${elementIndex + 1}`;
  }
  if (element.type === "component-instance") return `component #${elementIndex + 1}`;
  return `${element.type} #${elementIndex + 1}`;
}

export function getElementDisplayName(doc: NpngDocument, address: ElementAddress): string {
  const layer = doc.layers?.[address.layerIndex];
  const element = layer?.elements?.[address.elementIndex];
  const layerName = layer?.name || `Layer ${address.layerIndex + 1}`;
  if (!element) return `${layerName} / missing #${address.elementIndex + 1}`;
  return `${layerName} / ${getElementShortLabel(element, address.elementIndex)}`;
}
