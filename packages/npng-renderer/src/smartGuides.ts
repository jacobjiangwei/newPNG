import { getBoundingBox, mergeBoundingBoxes, type BoundingBox } from "./hitTest";
import type { ElementAddress } from "./editorState";
import type { NpngDocument } from "./types";
import { sameAddress } from "./elementTree";

export interface SmartGuide {
  orientation: "vertical" | "horizontal";
  position: number;
  from: number;
  to: number;
  label?: string;
}

export interface SmartSnapResult {
  dx: number;
  dy: number;
  guides: SmartGuide[];
}

interface SnapLine {
  orientation: "vertical" | "horizontal";
  value: number;
  from: number;
  to: number;
  label: string;
}

const SNAP_THRESHOLD = 6;

function isSelected(address: ElementAddress, selection: ElementAddress[]): boolean {
  return selection.some((selected) => sameAddress(selected, address));
}

function boxLines(box: BoundingBox, label: string): SnapLine[] {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  return [
    { orientation: "vertical", value: box.x, from: box.y, to: box.y + box.height, label: `${label} left` },
    { orientation: "vertical", value: centerX, from: box.y, to: box.y + box.height, label: `${label} center` },
    { orientation: "vertical", value: box.x + box.width, from: box.y, to: box.y + box.height, label: `${label} right` },
    { orientation: "horizontal", value: box.y, from: box.x, to: box.x + box.width, label: `${label} top` },
    { orientation: "horizontal", value: centerY, from: box.x, to: box.x + box.width, label: `${label} middle` },
    { orientation: "horizontal", value: box.y + box.height, from: box.x, to: box.x + box.width, label: `${label} bottom` },
  ];
}

function collectSnapTargets(doc: NpngDocument, selection: ElementAddress[]): SnapLine[] {
  const targets: SnapLine[] = [];
  const canvasWidth = doc.canvas?.width ?? 800;
  const canvasHeight = doc.canvas?.height ?? 600;
  targets.push(...boxLines({ x: 0, y: 0, width: canvasWidth, height: canvasHeight }, "Canvas"));

  for (let layerIndex = 0; layerIndex < (doc.layers?.length ?? 0); layerIndex++) {
    const layer = doc.layers?.[layerIndex];
    if (!layer || layer.visible === false || layer.locked) continue;
    for (let elementIndex = 0; elementIndex < (layer.elements?.length ?? 0); elementIndex++) {
      const element = layer.elements?.[elementIndex];
      if (!element || element.visible === false || element.locked) continue;
      const address = { layerIndex, elementIndex };
      if (isSelected(address, selection)) continue;
      const box = getBoundingBox(element);
      if (box.width <= 0 || box.height <= 0) continue;
      targets.push(...boxLines(box, element.name || `${element.type} ${elementIndex + 1}`));
    }
  }

  return targets;
}

function movedBox(box: BoundingBox, dx: number, dy: number): BoundingBox {
  return { ...box, x: box.x + dx, y: box.y + dy };
}

function axisLinesForBox(box: BoundingBox, orientation: "vertical" | "horizontal"): SnapLine[] {
  return boxLines(box, "Selection").filter((line) => line.orientation === orientation);
}

function bestAxisSnap(
  box: BoundingBox,
  targets: SnapLine[],
  orientation: "vertical" | "horizontal"
): { delta: number; guide: SmartGuide | null } {
  const sourceLines = axisLinesForBox(box, orientation);
  let best: { diff: number; source: SnapLine; target: SnapLine } | null = null;

  for (const source of sourceLines) {
    for (const target of targets) {
      if (target.orientation !== orientation) continue;
      const diff = target.value - source.value;
      if (Math.abs(diff) > SNAP_THRESHOLD) continue;
      if (!best || Math.abs(diff) < Math.abs(best.diff)) {
        best = { diff, source, target };
      }
    }
  }

  if (!best) return { delta: 0, guide: null };

  const sourceStart = best.source.from;
  const sourceEnd = best.source.to;
  const targetStart = best.target.from;
  const targetEnd = best.target.to;
  return {
    delta: best.diff,
    guide: {
      orientation,
      position: best.target.value,
      from: Math.min(sourceStart, sourceEnd, targetStart, targetEnd),
      to: Math.max(sourceStart, sourceEnd, targetStart, targetEnd),
      label: best.target.label,
    },
  };
}

export function calculateSmartSnap(
  doc: NpngDocument,
  selection: ElementAddress[],
  selectionBox: BoundingBox | null,
  rawDx: number,
  rawDy: number
): SmartSnapResult {
  if (!selectionBox || selection.length === 0) return { dx: rawDx, dy: rawDy, guides: [] };

  const targets = collectSnapTargets(doc, selection);
  const initialMovedBox = movedBox(selectionBox, rawDx, rawDy);
  const xSnap = bestAxisSnap(initialMovedBox, targets, "vertical");
  const afterXSnapBox = movedBox(selectionBox, rawDx + xSnap.delta, rawDy);
  const ySnap = bestAxisSnap(afterXSnapBox, targets, "horizontal");

  return {
    dx: rawDx + xSnap.delta,
    dy: rawDy + ySnap.delta,
    guides: [xSnap.guide, ySnap.guide].filter((guide): guide is SmartGuide => !!guide),
  };
}

export function getDocumentVisibleBounds(doc: NpngDocument): BoundingBox | null {
  const boxes = (doc.layers ?? []).flatMap((layer) => {
    if (layer.visible === false) return [];
    return (layer.elements ?? [])
      .filter((element) => element.visible !== false)
      .map(getBoundingBox);
  });
  return mergeBoundingBoxes(boxes);
}
