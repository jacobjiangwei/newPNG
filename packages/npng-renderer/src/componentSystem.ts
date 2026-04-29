import type { NpngElement, ComponentDef, ComponentInstanceElement } from "./types";
import { getBoundingBox } from "./hitTest";

type MutableElement = NpngElement & Record<string, unknown>;

export function resolveInstance(
  instance: ComponentInstanceElement,
  components: ComponentDef[]
): NpngElement | null {
  const compDef = components.find(c => c.id === instance.component_id);
  if (!compDef) return null;
  const resolved = structuredClone(compDef.master) as MutableElement;
  // Apply property overrides
  if (instance.overrides) {
    for (const [k, v] of Object.entries(instance.overrides)) {
      resolved[k] = v;
    }
  }
  // Apply element-level styling
  if (instance.fill !== undefined) resolved.fill = instance.fill;
  if (instance.stroke !== undefined) resolved.stroke = instance.stroke;
  const master = resolved as NpngElement;

  if (
    instance.x !== undefined ||
    instance.y !== undefined ||
    instance.width !== undefined ||
    instance.height !== undefined
  ) {
    const masterBox = getBoundingBox(master);
    const targetX = instance.x ?? masterBox.x;
    const targetY = instance.y ?? masterBox.y;
    const targetWidth = instance.width ?? masterBox.width;
    const targetHeight = instance.height ?? masterBox.height;
    const scaleX = masterBox.width > 0 ? targetWidth / masterBox.width : 1;
    const scaleY = masterBox.height > 0 ? targetHeight / masterBox.height : 1;
    const mapped: NpngElement = {
      type: "group",
      name: instance.name ?? compDef.name,
      opacity: instance.opacity,
      transform: {
        translate: [targetX - masterBox.x, targetY - masterBox.y],
        scale: [scaleX, scaleY],
        origin: [masterBox.x, masterBox.y],
      },
      elements: [master],
    };
    return mapped;
  }

  if (instance.opacity !== undefined) master.opacity = instance.opacity;
  return master;
}
