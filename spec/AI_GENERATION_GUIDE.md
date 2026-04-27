# NewPNG AI Generation Guide

This guide explains how an AI agent should generate editable NewPNG images. The output should be `.npng` YAML source, not a flattened bitmap. Users can then edit the source in NewPNG Studio and export PNG from the top-right toolbar.

For the complete format reference, see [`npng-v3.md`](./npng-v3.md).

## Core instruction for AI agents

When asked to create an image, generate a complete, valid NewPNG document:

```yaml
npng: "0.3"
canvas:
  width: 1200
  height: 800
  background: "#0B1020"
defs: []
layers:
  - name: "Background"
    visible: true
    opacity: 1
    blend_mode: "normal"
    elements: []
```

Always wrap the final document in a YAML code fence:

````markdown
```yaml
npng: "0.3"
canvas:
  width: 800
  height: 600
  background: "#FFFFFF"
layers:
  - name: "Layer 1"
    elements: []
```
````

## Generation rules

1. Return full `.npng` YAML, not JSON, SVG, CSS, prose, or a partial patch.
2. Use `npng: "0.3"` unless the user explicitly requests another supported version.
3. Use semantic `id` and `name` fields on important objects so later AI edits can target them.
4. Prefer editable primitives (`rect`, `ellipse`, `line`, `text`, `path`, `group`, `frame`) over one giant opaque path.
5. Keep real text as `type: text`; do not outline text as paths unless the user asks for logo/vectorized lettering.
6. Use groups, frames, layers, and names to express document structure like a design file.
7. Use gradients, fills, strokes, opacity, blend modes, filters, and effects for visual quality.
8. Keep coordinates explicit and stable. Use integers or one decimal place for most geometry.
9. For edits to an existing document, preserve unrelated layers, object IDs, names, and layout.
10. For PNG requests, still generate `.npng`; NewPNG Studio exports the PNG.

## Safe element vocabulary

These element types are safe for AI generation in the current Studio:

| Element | Use for |
|---|---|
| `rect` | Cards, panels, buttons, backgrounds, rounded UI blocks |
| `ellipse` | Circles, avatars, blobs, highlights, orbits |
| `line` | Dividers, arrows, connectors, strokes |
| `text` | Editable headings, labels, body copy, annotations |
| `path` | Icons, simple custom shapes, logos, decorative curves |
| `group` | Logical object grouping and shared transforms/effects |
| `frame` | Figma-like containers, artboards, auto-layout sections |
| `image` | User-provided raster image references or data URLs |
| `use` | Reuse items from `defs` |
| `component-instance` | Reuse items from `components` |

## Visual quality recipe

Good AI-generated NewPNG files usually have:

- A clear canvas size for the target output, such as `1024x1024`, `1200x800`, or `1600x900`.
- Named layers like `Background`, `Hero`, `Main card`, `Illustration`, `Text`, and `Decorations`.
- A small palette with consistent colors instead of random unrelated colors.
- Editable text boxes with `width`, `font_size`, `font_weight`, `line_height`, `align`, and `fill`.
- Rounded cards, soft gradients, subtle shadows/glows, and clear spacing.
- Reusable defs/components for repeated icons, badges, buttons, or decorative motifs.

## Example

```yaml
npng: "0.3"
canvas:
  width: 1200
  height: 800
  background: "#080B16"
defs: []
layers:
  - name: "Background"
    elements:
      - type: rect
        id: "bg-base"
        name: "Midnight background"
        x: 0
        y: 0
        width: 1200
        height: 800
        fill:
          type: linear-gradient
          x1: 0
          y1: 0
          x2: 1200
          y2: 800
          stops:
            - offset: 0
              color: "#111A35"
            - offset: 1
              color: "#050713"
      - type: ellipse
        id: "blue-glow"
        name: "Blue ambient glow"
        cx: 900
        cy: 180
        rx: 260
        ry: 180
        fill: "#3B82F680"
        effects:
          - type: blur
            radius: 40
        opacity: 0.55
  - name: "Hero card"
    elements:
      - type: rect
        id: "glass-card"
        name: "Glass product card"
        x: 260
        y: 190
        width: 680
        height: 390
        rx: 32
        ry: 32
        fill: "#FFFFFF14"
        stroke:
          color: "#FFFFFF33"
          width: 1
        effects:
          - type: drop-shadow
            dx: 0
            dy: 28
            radius: 48
            color: "#00000070"
      - type: text
        id: "hero-title"
        name: "Hero title"
        x: 320
        y: 270
        width: 560
        content: "AI-made. Human-editable."
        font_size: 48
        font_weight: "bold"
        line_height: 1.1
        fill: "#FFFFFF"
      - type: text
        id: "hero-subtitle"
        name: "Hero subtitle"
        x: 322
        y: 390
        width: 500
        content: "Generate layered design source, refine it visually, and export a sharp PNG."
        font_size: 21
        line_height: 1.45
        fill: "#B8C7E8"
```

## Preflight checklist

Before returning YAML, check:

- Top-level `npng`, `canvas`, and `layers` exist.
- Every layer has an `elements` array.
- Important objects have stable `id` and readable `name`.
- Text is editable `type: text`.
- Colors are hex strings like `#FFFFFF` or `#FFFFFF80`.
- Gradients use `type`, coordinates, and `stops`.
- The document can stand alone without external hidden context.
