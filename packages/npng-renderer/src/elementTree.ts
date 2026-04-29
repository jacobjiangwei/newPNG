import type { ElementAddress } from "./editorState";
import type { Layer, NpngDocument, NpngElement } from "./types";

export function addressPath(address: ElementAddress): number[] {
  return address.path?.length ? address.path : [address.elementIndex];
}

export function addressKey(address: ElementAddress): string {
  return `${address.layerIndex}:${addressPath(address).join(".")}`;
}

export function sameAddress(a: ElementAddress, b: ElementAddress): boolean {
  return a.layerIndex === b.layerIndex && addressKey(a) === addressKey(b);
}

export function isAncestorAddress(ancestor: ElementAddress, descendant: ElementAddress): boolean {
  if (ancestor.layerIndex !== descendant.layerIndex) return false;
  const ancestorPath = addressPath(ancestor);
  const descendantPath = addressPath(descendant);
  if (ancestorPath.length >= descendantPath.length) return false;
  return ancestorPath.every((segment, index) => segment === descendantPath[index]);
}

export function dropDescendantAddresses(addresses: ElementAddress[]): ElementAddress[] {
  return addresses.filter((address) => !addresses.some((candidate) => isAncestorAddress(candidate, address)));
}

export function compareAddressForRemoval(a: ElementAddress, b: ElementAddress): number {
  if (a.layerIndex !== b.layerIndex) return b.layerIndex - a.layerIndex;
  const aPath = addressPath(a);
  const bPath = addressPath(b);
  const maxLength = Math.max(aPath.length, bPath.length);
  for (let i = 0; i < maxLength; i++) {
    const aSegment = aPath[i] ?? -1;
    const bSegment = bPath[i] ?? -1;
    if (aSegment !== bSegment) return bSegment - aSegment;
  }
  return bPath.length - aPath.length;
}

export function childElements(element: NpngElement): NpngElement[] | undefined {
  if (element.type === "group") return element.elements;
  if (element.type === "frame") return element.children;
  return undefined;
}

export function getElementAtAddress(doc: NpngDocument, address: ElementAddress): NpngElement | undefined {
  const layer = doc.layers?.[address.layerIndex];
  if (!layer) return undefined;
  let list = layer.elements;
  const path = addressPath(address);
  let current: NpngElement | undefined;
  for (const index of path) {
    current = list?.[index];
    if (!current) return undefined;
    list = childElements(current);
  }
  return current;
}

export function getParentElementList(
  doc: NpngDocument,
  address: ElementAddress
): { list: NpngElement[]; index: number; layer: Layer } | null {
  const layer = doc.layers?.[address.layerIndex];
  const path = addressPath(address);
  if (!layer || path.length === 0) return null;
  let list = layer.elements;
  for (const index of path.slice(0, -1)) {
    const parent = list?.[index];
    list = parent ? childElements(parent) : undefined;
    if (!list) return null;
  }
  if (!list) return null;
  return { list, index: path[path.length - 1], layer };
}

export function parentPath(address: ElementAddress): number[] {
  return addressPath(address).slice(0, -1);
}

export function isTopLevelAddress(address: ElementAddress): boolean {
  return addressPath(address).length === 1;
}

export function makeAddress(layerIndex: number, path: number[]): ElementAddress {
  return { layerIndex, elementIndex: path[path.length - 1] ?? 0, path };
}

export function isEditableAddress(doc: NpngDocument, address: ElementAddress): boolean {
  const layer = doc.layers?.[address.layerIndex];
  if (!layer || layer.visible === false || layer.locked) return false;
  let list = layer.elements;
  const path = addressPath(address);
  for (const [pathIndex, index] of path.entries()) {
    const element = list?.[index];
    if (!element || element.visible === false || element.locked) return false;
    if (pathIndex < path.length - 1 && element.transform) return false;
    list = childElements(element);
  }
  return true;
}

export function collectElementAddresses(doc: NpngDocument): ElementAddress[] {
  const addresses: ElementAddress[] = [];
  const visit = (layerIndex: number, elements: NpngElement[] | undefined, prefix: number[]) => {
    elements?.forEach((element, index) => {
      const path = [...prefix, index];
      const address = makeAddress(layerIndex, path);
      if (isEditableAddress(doc, address)) addresses.push(address);
      const children = childElements(element);
      if (children?.length && !element.transform) visit(layerIndex, children, path);
    });
  };

  doc.layers?.forEach((layer, layerIndex) => {
    if (layer.visible === false || layer.locked) return;
    visit(layerIndex, layer.elements, []);
  });

  return addresses;
}
