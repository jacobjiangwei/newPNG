/**
 * npng-renderer — Render npng vector graphics to Canvas 2D or SVG
 *
 * @example
 * ```ts
 * import yaml from 'js-yaml';
 * import { renderNpng, npngToSvg } from 'npng-renderer';
 *
 * const doc = yaml.load(yamlString);
 * renderNpng(canvas, doc);           // Render to Canvas 2D
 * const svg = npngToSvg(doc);        // Convert to SVG string
 * ```
 *
 * @packageDocumentation
 */

// Core types
export type {
  NpngDocument,
  NpngElement,
  NpngCanvas,
  Layer,
  DefItem,
  ComponentDef,
  FillSpec,
  StrokeSpec,
  GradientStop,
  LinearGradient,
  RadialGradient,
  TransformSpec,
  FilterSpec,
  EffectSpec,
  TextElement,
  RectElement,
  EllipseElement,
  LineElement,
  PathElement,
  GroupElement,
  ImageElement,
  FrameElement,
  BooleanElement,
} from "./types";

// Renderer
export { renderNpng, preloadNpngImages } from "./renderer";

// SVG export
export { npngToSvg } from "./svgExporter";

// Utilities
export { parseColor, rgbaString } from "./colors";
export { parsePath, tracePath } from "./pathParser";
