# npng Format Specification — v0.5

> **npng** is an AI-native, human-readable YAML vector graphics format.
> Think of it as **Markdown for design files** — structured, diffable, and LLM-friendly.

**Specification version:** 0.5
**Status:** Stable
**Maintained by:** [nextPNG](https://nextpng.org) · [GitHub](https://github.com/jacobjiangwei/nextPNG)

---

## Table of Contents

1. [Overview](#overview)
2. [Document Structure](#document-structure)
3. [Canvas](#canvas)
4. [Layers](#layers)
5. [Elements — Common Fields](#elements--common-fields)
6. [Element Types](#element-types)
   - [rect](#rect)
   - [ellipse](#ellipse)
   - [line](#line)
   - [text](#text)
   - [path](#path)
   - [group](#group)
   - [frame](#frame)
   - [image](#image)
   - [boolean](#boolean)
   - [use](#use)
   - [component-instance](#component-instance)
7. [Fill System](#fill-system)
8. [Stroke System](#stroke-system)
9. [Gradients](#gradients)
10. [Multiple Fills & Strokes](#multiple-fills--strokes)
11. [Transforms](#transforms)
12. [Blend Modes](#blend-modes)
13. [Filters](#filters)
14. [Effects](#effects)
15. [Clip Paths & Masks](#clip-paths--masks)
16. [Definitions (defs) & use](#definitions-defs--use)
17. [Components & Instances](#components--instances)
18. [Auto Layout](#auto-layout)
19. [Constraints](#constraints)
20. [Rich Text (spans)](#rich-text-spans)
21. [Color Format](#color-format)
22. [SVG Path Commands](#svg-path-commands)
23. [Version History](#version-history)
24. [Design Principles](#design-principles)

---

## Overview

A `.npng` file is valid YAML describing a vector graphics document. Any YAML parser can read it. Any Canvas 2D or SVG renderer can draw it.

**Key properties:**
- Human-readable and writable in any text editor
- AI/LLM-friendly — designed for generation by language models
- Git-diffable — meaningful diffs, easy merges
- Layered — layers, groups, frames, components
- Declarative — describes *what*, not *how to draw*
- Forward-compatible — renderers ignore unknown fields

---

## Document Structure

```yaml
npng: "0.5"                    # Format version (required)
canvas:                         # Canvas definition (required)
  width: 800
  height: 600
  background: "#FFFFFF"
defs: []                        # Reusable definitions (optional)
components: []                  # Component definitions (optional)
layers:                         # Ordered layer list (required)
  - name: "Layer 1"
    elements: [...]
```

| Field        | Type             | Required | Description                          |
|--------------|------------------|----------|--------------------------------------|
| `npng`       | string           | yes      | Format version, e.g. `"0.5"`        |
| `canvas`     | [Canvas](#canvas) | yes     | Canvas dimensions and background     |
| `defs`       | DefItem[]        | no       | Reusable element definitions         |
| `components` | ComponentDef[]   | no       | Component master definitions         |
| `layers`     | [Layer](#layers)[] | yes    | Ordered list of layers (bottom→top)  |

---

## Canvas

| Field        | Type   | Default         | Description                              |
|--------------|--------|-----------------|------------------------------------------|
| `width`      | number | 800             | Canvas width in pixels                   |
| `height`     | number | 600             | Canvas height in pixels                  |
| `background` | string | `"transparent"` | Background color (hex) or `"transparent"` |

```yaml
canvas:
  width: 1200
  height: 800
  background: "#1A1A2E"
```

---

## Layers

Layers render bottom-to-top. Each layer contains an ordered list of elements.

| Field        | Type          | Default    | Description                                    |
|--------------|---------------|------------|------------------------------------------------|
| `name`       | string        | `""`       | Human-readable layer name                      |
| `visible`    | boolean       | `true`     | Whether this layer is rendered                 |
| `locked`     | boolean       | `false`    | Whether elements can be selected/edited        |
| `opacity`    | number        | `1.0`      | Layer opacity (0.0–1.0)                        |
| `blend_mode` | BlendMode     | `"normal"` | Layer blend mode                               |
| `filters`    | FilterSpec[]  | `[]`       | Filters applied to entire layer                |
| `clip_path`  | string        | none       | SVG path data used as clipping region          |
| `mask`       | string        | none       | ID of a def used as alpha mask                 |
| `elements`   | NpngElement[] | `[]`       | Elements in this layer                         |

```yaml
layers:
  - name: "Background"
    opacity: 0.5
    blend_mode: "multiply"
    elements:
      - type: rect
        x: 0
        y: 0
        width: 800
        height: 600
        fill: "#E8E8E8"

  - name: "Foreground"
    clip_path: "M 100 100 L 700 100 L 700 500 L 100 500 Z"
    elements:
      - type: ellipse
        cx: 400
        cy: 300
        rx: 200
        ry: 150
        fill: "#3498DB"
```

---

## Elements — Common Fields

All element types share these fields from `BaseElement`:

| Field         | Type                          | Default    | Description                                          |
|---------------|-------------------------------|------------|------------------------------------------------------|
| `type`        | string                        | **required** | Element type identifier                            |
| `id`          | string                        | none       | Stable machine-readable ID for references/overrides  |
| `name`        | string                        | `""`       | Human-readable name (shown in layer panels)          |
| `visible`     | boolean                       | `true`     | Whether this element is rendered                     |
| `locked`      | boolean                       | `false`    | Whether this element can be edited                   |
| `opacity`     | number                        | `1.0`      | Per-element opacity (0.0–1.0)                        |
| `fill`        | FillSpec                      | none       | Fill color, gradient, or `null`/`"none"`             |
| `fills`       | FillLayer[]                   | none       | Multiple fill layers (bottom→top)                    |
| `stroke`      | StrokeSpec                    | none       | Stroke specification                                 |
| `strokes`     | StrokeLayer[]                 | none       | Multiple stroke layers                               |
| `transform`   | TransformSpec                 | none       | Position/rotation/scale transform                    |
| `blend_mode`  | BlendMode                     | `"normal"` | Element blend mode                                   |
| `filters`     | FilterSpec[]                  | `[]`       | CSS-like filters (blur, drop-shadow)                 |
| `effects`     | EffectSpec[]                  | `[]`       | Visual effects (shadows, glows)                      |
| `clip_path`   | string                        | none       | SVG path data for clipping                           |
| `mask`        | string                        | none       | Def ID used as alpha mask                            |
| `constraints` | Constraints                   | none       | Resize constraints (Figma-style)                     |
| `layout_item` | LayoutItemSpec                | none       | Auto-layout child behavior                           |

---

## Element Types

### rect

Rectangle with optional rounded corners.

| Field           | Type   | Default | Description                              |
|-----------------|--------|---------|------------------------------------------|
| `x`             | number | `0`     | Left edge x                              |
| `y`             | number | `0`     | Top edge y                               |
| `width`         | number | `0`     | Width                                    |
| `height`        | number | `0`     | Height                                   |
| `rx`            | number | `0`     | Corner radius x (or use `corner_radius`) |
| `ry`            | number | `0`     | Corner radius y                          |
| `corner_radius` | number | `0`     | Uniform corner radius (shorthand)        |

```yaml
- type: rect
  x: 50
  y: 50
  width: 200
  height: 100
  corner_radius: 12
  fill: "#FF6B6B"
  stroke:
    color: "#CC5555"
    width: 2
```

---

### ellipse

Ellipse or circle defined by center and radii.

| Field | Type   | Default | Description    |
|-------|--------|---------|----------------|
| `cx`  | number | `0`     | Center x       |
| `cy`  | number | `0`     | Center y       |
| `rx`  | number | `0`     | Horizontal radius |
| `ry`  | number | `0`     | Vertical radius   |

```yaml
- type: ellipse
  cx: 200
  cy: 200
  rx: 80
  ry: 80
  fill:
    type: radial-gradient
    cx: 200
    cy: 200
    r: 80
    stops:
      - offset: 0
        color: "#FFFFFF"
      - offset: 1
        color: "#3498DB"
```

---

### line

Line segment with optional arrow endpoints.

| Field         | Type         | Default  | Description                                  |
|---------------|--------------|----------|----------------------------------------------|
| `x1`          | number       | `0`      | Start x                                      |
| `y1`          | number       | `0`      | Start y                                      |
| `x2`          | number       | `0`      | End x                                        |
| `y2`          | number       | `0`      | End y                                        |
| `arrow_start` | ArrowEndType | `"none"` | Start endpoint style                         |
| `arrow_end`   | ArrowEndType | `"none"` | End endpoint style                           |

**ArrowEndType:** `"none"` | `"arrow"` | `"circle"` | `"diamond"`

```yaml
- type: line
  x1: 50
  y1: 100
  x2: 350
  y2: 100
  arrow_end: "arrow"
  stroke:
    color: "#2C3E50"
    width: 3
    cap: "round"
```

---

### text

Single-line or multi-line text with optional rich text spans.

| Field               | Type       | Default      | Description                                  |
|---------------------|------------|--------------|----------------------------------------------|
| `x`                 | number     | `0`          | Text origin x                                |
| `y`                 | number     | `0`          | Text origin y (baseline for first line)      |
| `content`           | string     | `""`         | Plain text content (newlines create paragraphs) |
| `width`             | number     | none         | Text box width (enables word wrap)           |
| `font_size`         | number     | `16`         | Font size in pixels                          |
| `font_family`       | string     | `"sans-serif"` | CSS font family name                       |
| `font_weight`       | string     | `"normal"`   | Font weight (`"normal"`, `"bold"`, `"100"`–`"900"`) |
| `align`             | string     | `"left"`     | Horizontal alignment: `"left"` \| `"center"` \| `"right"` |
| `line_height`       | number     | `1.2`        | Line height multiplier                       |
| `letter_spacing`    | number     | `0`          | Letter spacing in pixels                     |
| `paragraph_spacing` | number     | `0`          | Extra spacing between paragraphs             |
| `vertical_align`    | string     | `"top"`      | Vertical alignment: `"top"` \| `"center"` \| `"bottom"` |
| `spans`             | TextSpan[] | none         | Rich text spans (overrides `content`)        |

```yaml
# Simple text
- type: text
  x: 100
  y: 50
  content: "Hello World"
  font_size: 32
  font_family: "Inter"
  font_weight: "bold"
  fill: "#FFFFFF"
  align: "center"

# Wrapped text
- type: text
  x: 50
  y: 50
  width: 300
  content: "This is a long paragraph that will automatically wrap within the 300px text box width."
  font_size: 16
  line_height: 1.5
  fill: "#333333"
```

See [Rich Text (spans)](#rich-text-spans) for mixed-style text.

---

### path

SVG-compatible path element.

| Field       | Type   | Default      | Description                        |
|-------------|--------|--------------|------------------------------------|
| `d`         | string | `""`         | SVG path data string               |
| `fill_rule` | string | `"nonzero"`  | `"nonzero"` \| `"evenodd"`        |

```yaml
- type: path
  d: "M 200 50 L 230 140 L 325 140 L 248 195 L 275 285 L 200 232 L 125 285 L 152 195 L 75 140 L 170 140 Z"
  fill: "#FFD700"
  fill_rule: "evenodd"
  stroke:
    color: "#B8860B"
    width: 2
```

See [SVG Path Commands](#svg-path-commands) for supported commands.

---

### group

A container that groups child elements together. Groups can be nested.

| Field      | Type          | Default | Description              |
|------------|---------------|---------|--------------------------|
| `elements` | NpngElement[] | `[]`    | Child elements           |

Groups inherit all common fields. When a group has `opacity`, `blend_mode`, `filters`, or `effects`, it is rendered as an isolated compositing layer.

```yaml
- type: group
  name: "button"
  opacity: 0.9
  elements:
    - type: rect
      x: 0
      y: 0
      width: 120
      height: 40
      corner_radius: 8
      fill: "#3498DB"
    - type: text
      x: 60
      y: 26
      content: "Click"
      font_size: 14
      fill: "#FFFFFF"
      align: "center"
```

---

### frame

A clipped container with optional auto-layout. Like Figma frames — children are clipped to the frame bounds, and the frame itself can have fill/stroke.

| Field         | Type           | Default | Description                           |
|---------------|----------------|---------|---------------------------------------|
| `x`           | number         | `0`     | Frame x position                      |
| `y`           | number         | `0`     | Frame y position                      |
| `width`       | number         | `0`     | Frame width                           |
| `height`      | number         | `0`     | Frame height                          |
| `auto_layout` | AutoLayoutSpec | none    | Flex-like auto layout                 |
| `children`    | NpngElement[]  | `[]`    | Child elements (clipped to frame)     |

```yaml
- type: frame
  x: 50
  y: 50
  width: 300
  height: 200
  fill: "#FFFFFF"
  corner_radius: 12
  auto_layout:
    mode: "vertical"
    gap: 8
    padding: [16, 16, 16, 16]
    align_items: "center"
  children:
    - type: text
      content: "Title"
      font_size: 20
      font_weight: "bold"
      fill: "#000000"
    - type: text
      content: "Description text here"
      font_size: 14
      fill: "#666666"
```

---

### image

Raster image element with fit modes and adjustments.

| Field           | Type   | Default  | Description                                     |
|-----------------|--------|----------|-------------------------------------------------|
| `x`             | number | `0`      | Image x position                                |
| `y`             | number | `0`      | Image y position                                |
| `width`         | number | `0`      | Display width                                   |
| `height`        | number | `0`      | Display height                                  |
| `href`          | string | `""`     | Image URL or data URI (`data:image/png;base64,...`) |
| `fit`           | string | `"fill"` | `"fill"` \| `"contain"` \| `"cover"` \| `"none"` |
| `border_radius` | number | `0`      | Corner radius for clipping                      |
| `adjustments`   | object | none     | Image adjustment filters                        |

**Adjustments:**

| Field        | Type   | Default | Range         | Description          |
|--------------|--------|---------|---------------|----------------------|
| `brightness` | number | `0`     | -100 to 100   | Brightness offset    |
| `contrast`   | number | `0`     | -100 to 100   | Contrast offset      |
| `saturation` | number | `0`     | -100 to 100   | Saturation offset    |
| `hue_rotate` | number | `0`     | 0 to 360      | Hue rotation degrees |

```yaml
- type: image
  x: 50
  y: 50
  width: 300
  height: 200
  href: "https://example.com/photo.jpg"
  fit: "cover"
  border_radius: 12
  adjustments:
    brightness: 10
    contrast: 15
    saturation: -20
```

---

### boolean

Boolean operation combining subject and clip shapes.

| Field       | Type          | Default    | Description                                      |
|-------------|---------------|------------|--------------------------------------------------|
| `op`        | string        | `"union"`  | `"union"` \| `"subtract"` \| `"intersect"` \| `"exclude"` |
| `subjects`  | NpngElement[] | `[]`       | Subject shapes (the base)                        |
| `clips`     | NpngElement[] | `[]`       | Clip shapes (applied to subjects)                |
| `fill_rule` | string        | `"nonzero"` | `"nonzero"` \| `"evenodd"`                      |

**Operations:**
- **union** — All shapes combined (like adding)
- **subtract** — Clips cut out of subjects (like punching holes)
- **intersect** — Only the overlapping area remains
- **exclude** — Everything except the overlap (XOR)

```yaml
- type: boolean
  op: "subtract"
  subjects:
    - type: ellipse
      cx: 150
      cy: 150
      rx: 100
      ry: 100
      fill: "#E74C3C"
  clips:
    - type: ellipse
      cx: 200
      cy: 120
      rx: 80
      ry: 80
      fill: "#FFFFFF"
```

---

### use

References a definition from the `defs` array by ID.

| Field | Type   | Default | Description                           |
|-------|--------|---------|---------------------------------------|
| `ref` | string | none    | ID of the referenced def              |
| `x`   | number | none    | Override x position                   |
| `y`   | number | none    | Override y position                   |
| `cx`  | number | none    | Override center x (for ellipses)      |
| `cy`  | number | none    | Override center y (for ellipses)      |

```yaml
defs:
  - id: "icon-star"
    type: path
    d: "M 0 -20 L 6 -6 L 20 -4 L 10 8 L 12 22 L 0 16 L -12 22 L -10 8 L -20 -4 L -6 -6 Z"
    fill: "#FFD700"

layers:
  - name: "stars"
    elements:
      - type: use
        ref: "icon-star"
        transform:
          translate: [100, 100]
      - type: use
        ref: "icon-star"
        transform:
          translate: [200, 100]
          scale: 1.5
```

---

### component-instance

Instantiates a component definition with optional overrides.

| Field          | Type   | Default | Description                                    |
|----------------|--------|---------|------------------------------------------------|
| `component_id` | string | none   | ID of the component to instantiate             |
| `x`            | number | none    | Instance x position                            |
| `y`            | number | none    | Instance y position                            |
| `width`        | number | none    | Instance width (scales the master)             |
| `height`       | number | none    | Instance height (scales the master)            |
| `overrides`    | object | none    | Property overrides keyed by element ID         |

```yaml
components:
  - id: "btn-primary"
    name: "Primary Button"
    master:
      type: group
      elements:
        - type: rect
          id: "bg"
          x: 0
          y: 0
          width: 120
          height: 40
          corner_radius: 8
          fill: "#3498DB"
        - type: text
          id: "label"
          x: 60
          y: 26
          content: "Button"
          font_size: 14
          fill: "#FFFFFF"
          align: "center"

layers:
  - name: "UI"
    elements:
      - type: component-instance
        component_id: "btn-primary"
        x: 50
        y: 100
        overrides:
          label:
            content: "Submit"
          bg:
            fill: "#27AE60"
```

---

## Fill System

The `fill` field accepts a solid color string, a gradient object, `null`, or `"none"` (no fill).

```yaml
# Solid color
fill: "#FF6B6B"

# With alpha
fill: "#FF6B6B80"

# No fill
fill: null
# or
fill: "none"

# Gradient (see Gradients section)
fill:
  type: linear-gradient
  x1: 0
  y1: 0
  x2: 200
  y2: 0
  stops:
    - offset: 0
      color: "#FF0000"
    - offset: 1
      color: "#0000FF"
```

---

## Stroke System

| Field       | Type     | Default    | Description                               |
|-------------|----------|------------|-------------------------------------------|
| `color`     | string   | `"#000000"` | Stroke color (hex)                       |
| `width`     | number   | `1`        | Stroke width in pixels                    |
| `dash`      | number[] | none       | Dash pattern `[dash, gap, ...]`           |
| `cap`       | string   | `"butt"`   | Line cap: `"butt"` \| `"round"` \| `"square"` |
| `join`      | string   | `"miter"`  | Line join: `"miter"` \| `"round"` \| `"bevel"` |
| `alignment` | string   | `"center"` | `"inside"` \| `"outside"` \| `"center"` (planned) |

```yaml
stroke:
  color: "#2C3E50"
  width: 3
  dash: [8, 4]
  cap: "round"
  join: "round"
```

---

## Gradients

### Linear Gradient

| Field   | Type           | Description                  |
|---------|----------------|------------------------------|
| `type`  | `"linear-gradient"` | Gradient type identifier |
| `x1`    | number         | Start x                      |
| `y1`    | number         | Start y                      |
| `x2`    | number         | End x                        |
| `y2`    | number         | End y                        |
| `stops` | GradientStop[] | Color stop list              |

### Radial Gradient

| Field   | Type           | Description                  |
|---------|----------------|------------------------------|
| `type`  | `"radial-gradient"` | Gradient type identifier |
| `cx`    | number         | Center x                     |
| `cy`    | number         | Center y                     |
| `r`     | number         | Radius                       |
| `stops` | GradientStop[] | Color stop list              |

### Gradient Stop

| Field    | Type   | Description                       |
|----------|--------|-----------------------------------|
| `offset` | number | Position (0.0 to 1.0)            |
| `color`  | string | Color at this stop (hex string)  |

```yaml
fill:
  type: linear-gradient
  x1: 0
  y1: 0
  x2: 0
  y2: 200
  stops:
    - offset: 0
      color: "#FF6B6B"
    - offset: 0.5
      color: "#FFD93D"
    - offset: 1
      color: "#6BCB77"
```

---

## Multiple Fills & Strokes

Elements can have multiple fills and strokes, rendered bottom-to-top. Use `fills` and `strokes` arrays instead of (or alongside) `fill` and `stroke`.

### FillLayer

| Field        | Type      | Default    | Description                |
|--------------|-----------|------------|----------------------------|
| `fill`       | FillSpec  | required   | Color or gradient          |
| `opacity`    | number    | `1.0`      | Fill layer opacity         |
| `blend_mode` | BlendMode | `"normal"` | Fill layer blend mode      |

### StrokeLayer

All fields from StrokeSpec plus:

| Field     | Type   | Default | Description              |
|-----------|--------|---------|--------------------------|
| `opacity` | number | `1.0`   | Stroke layer opacity     |

```yaml
- type: rect
  x: 50
  y: 50
  width: 200
  height: 100
  fills:
    - fill: "#3498DB"
    - fill:
        type: linear-gradient
        x1: 50
        y1: 50
        x2: 250
        y2: 150
        stops:
          - offset: 0
            color: "#FFFFFF00"
          - offset: 1
            color: "#FFFFFF80"
      blend_mode: "screen"
  strokes:
    - color: "#2980B9"
      width: 2
    - color: "#FFFFFF40"
      width: 1
```

---

## Transforms

Any element can have a `transform` field. Transforms apply in order: translate → rotate → scale, around the specified origin.

| Field       | Type                     | Default     | Description                           |
|-------------|--------------------------|-------------|---------------------------------------|
| `translate` | `[number, number]`       | `[0, 0]`    | Translation offset `[x, y]`          |
| `rotate`    | number                   | `0`         | Rotation in degrees (clockwise)       |
| `scale`     | number or `[number, number]` | `1`    | Uniform or `[scaleX, scaleY]`        |
| `origin`    | `[number, number]`       | element center | Transform origin `[x, y]`         |

```yaml
- type: rect
  x: -50
  y: -25
  width: 100
  height: 50
  fill: "#E74C3C"
  transform:
    translate: [200, 200]
    rotate: 45
    scale: [1.5, 1.0]
    origin: [0, 0]
```

---

## Blend Modes

Supported blend modes for layers, elements, and fill layers:

| Value          | Description                          |
|----------------|--------------------------------------|
| `normal`       | Default compositing                  |
| `multiply`     | Darkens by multiplying colors        |
| `screen`       | Lightens by inverting multiply       |
| `overlay`      | Combines multiply and screen         |
| `darken`       | Keeps darker values                  |
| `lighten`      | Keeps lighter values                 |
| `color-dodge`  | Brightens to reflect source          |
| `color-burn`   | Darkens to reflect source            |
| `hard-light`   | Hard multiply/screen split           |
| `soft-light`   | Soft multiply/screen split           |
| `difference`   | Absolute difference of colors        |
| `exclusion`    | Lower contrast difference            |

---

## Filters

Applied via the `filters` field on elements and layers. Uses CSS filter syntax under the hood.

| Type           | Fields                              | Description              |
|----------------|-------------------------------------|--------------------------|
| `blur`         | `radius: number`                    | Gaussian blur            |
| `drop-shadow`  | `dx, dy, radius: number; color: string` | Drop shadow filter  |

```yaml
filters:
  - type: blur
    radius: 5
  - type: drop-shadow
    dx: 3
    dy: 3
    radius: 8
    color: "#00000060"
```

---

## Effects

Applied via the `effects` field on elements. Effects are more expressive than filters and support inner effects.

| Type           | Fields                                                | Description                    |
|----------------|-------------------------------------------------------|--------------------------------|
| `blur`         | `radius`                                              | Element blur                   |
| `drop-shadow`  | `dx, dy, radius, spread?, color, opacity?, blend_mode?` | Outer shadow                |
| `inner-shadow` | `dx, dy, radius, spread?, color, opacity?, blend_mode?` | Inner shadow                |
| `outer-glow`   | `radius, spread?, color, opacity?, blend_mode?`       | Outer glow                     |
| `inner-glow`   | `radius, spread?, color, opacity?, blend_mode?`       | Inner glow                     |

```yaml
effects:
  - type: drop-shadow
    dx: 0
    dy: 4
    radius: 12
    color: "#00000040"
  - type: inner-shadow
    dx: 0
    dy: -2
    radius: 4
    color: "#00000020"
  - type: outer-glow
    radius: 15
    color: "#3498DB60"
```

---

## Clip Paths & Masks

### Clip Path

An SVG path string that defines a clipping region. Everything outside is invisible.

```yaml
# On an element
- type: rect
  x: 0
  y: 0
  width: 200
  height: 200
  fill: "#3498DB"
  clip_path: "M 100 0 L 200 100 L 100 200 L 0 100 Z"

# On a layer
- name: "Clipped layer"
  clip_path: "M 50 50 L 350 50 L 350 250 L 50 250 Z"
  elements: [...]
```

### Mask

References a def whose elements define the alpha mask. White = visible, black = hidden, gray = semi-transparent.

```yaml
defs:
  - id: "vignette-mask"
    elements:
      - type: ellipse
        cx: 200
        cy: 200
        rx: 180
        ry: 180
        fill: "#FFFFFF"

layers:
  - name: "Vignetted content"
    mask: "vignette-mask"
    elements:
      - type: image
        href: "photo.jpg"
        x: 0
        y: 0
        width: 400
        height: 400
```

---

## Definitions (defs) & use

The top-level `defs` array defines reusable elements and mask groups. Reference them with `use` elements or `mask` fields.

```yaml
defs:
  # A reusable shape
  - id: "arrow-icon"
    type: path
    d: "M 0 -10 L 15 0 L 0 10 Z"
    fill: "#FFFFFF"

  # A mask group
  - id: "circle-mask"
    elements:
      - type: ellipse
        cx: 50
        cy: 50
        rx: 50
        ry: 50
        fill: "#FFFFFF"
```

Each def must have a unique `id`. The def can be any element type, or an object with `elements` for mask groups.

---

## Components & Instances

Components allow defining reusable master elements with named sub-elements that can be overridden per instance.

### ComponentDef

| Field        | Type       | Description                              |
|--------------|------------|------------------------------------------|
| `id`         | string     | Unique component ID                      |
| `name`       | string     | Human-readable component name            |
| `master`     | NpngElement | The master element tree                  |
| `properties` | object     | Default properties (reserved)            |

### component-instance

When instantiated, the master is cloned and overrides are applied by matching element `id` fields within the master tree. If `width`/`height` differ from the master's bounds, the instance is scaled to fit.

```yaml
components:
  - id: "avatar"
    name: "Avatar"
    master:
      type: group
      elements:
        - type: ellipse
          id: "bg"
          cx: 25
          cy: 25
          rx: 25
          ry: 25
          fill: "#3498DB"
        - type: text
          id: "initials"
          x: 25
          y: 31
          content: "AB"
          font_size: 16
          font_weight: "bold"
          fill: "#FFFFFF"
          align: "center"

layers:
  - name: "Team"
    elements:
      - type: component-instance
        component_id: "avatar"
        x: 10
        y: 10
        overrides:
          initials:
            content: "JW"
          bg:
            fill: "#E74C3C"
      - type: component-instance
        component_id: "avatar"
        x: 70
        y: 10
        overrides:
          initials:
            content: "KL"
```

---

## Auto Layout

Frames can use auto-layout for flex-like arrangement of children.

### AutoLayoutSpec

| Field             | Type                               | Default   | Description                          |
|-------------------|-------------------------------------|-----------|--------------------------------------|
| `mode`            | `"horizontal"` \| `"vertical"`     | required  | Layout direction                     |
| `gap`             | number                              | `0`       | Spacing between children             |
| `padding`         | number or `[top, right, bottom, left]` | `0`   | Inner padding                        |
| `align_items`     | `"start"` \| `"center"` \| `"end"` \| `"stretch"` | `"start"` | Cross-axis alignment     |
| `justify_content` | `"start"` \| `"center"` \| `"end"` \| `"space-between"` | `"start"` | Main-axis distribution |

### LayoutItemSpec (on child elements)

| Field        | Type                                              | Default  | Description                     |
|--------------|---------------------------------------------------|----------|---------------------------------|
| `grow`       | number                                            | `0`      | Flex grow factor                |
| `shrink`     | number                                            | `0`      | Flex shrink factor              |
| `align_self` | `"auto"` \| `"start"` \| `"center"` \| `"end"` \| `"stretch"` | `"auto"` | Override parent align  |

```yaml
- type: frame
  x: 20
  y: 20
  width: 360
  height: 60
  fill: "#F5F5F5"
  auto_layout:
    mode: "horizontal"
    gap: 12
    padding: [10, 16, 10, 16]
    align_items: "center"
    justify_content: "space-between"
  children:
    - type: text
      content: "Label"
      font_size: 14
      fill: "#333"
    - type: rect
      width: 80
      height: 36
      corner_radius: 6
      fill: "#3498DB"
      layout_item:
        align_self: "center"
```

---

## Constraints

Resize constraints define how an element responds when its parent frame is resized (similar to Figma constraints).

| Field        | Type   | Values                                                   |
|--------------|--------|----------------------------------------------------------|
| `horizontal` | string | `"left"` \| `"right"` \| `"center"` \| `"left-right"` \| `"scale"` |
| `vertical`   | string | `"top"` \| `"bottom"` \| `"center"` \| `"top-bottom"` \| `"scale"` |

```yaml
- type: rect
  x: 10
  y: 10
  width: 100
  height: 40
  fill: "#3498DB"
  constraints:
    horizontal: "left-right"
    vertical: "top"
```

---

## Rich Text (spans)

For mixed-style text, use the `spans` array instead of `content`. Each span can override the parent text element's style.

### TextSpan

| Field            | Type    | Default   | Description                    |
|------------------|---------|-----------|--------------------------------|
| `text`           | string  | required  | The text content               |
| `bold`           | boolean | `false`   | Bold weight                    |
| `italic`         | boolean | `false`   | Italic style                   |
| `underline`      | boolean | `false`   | Underline decoration           |
| `font_size`      | number  | inherited | Override font size             |
| `font_weight`    | string  | inherited | Override font weight           |
| `letter_spacing` | number  | inherited | Override letter spacing        |
| `fill`           | string  | inherited | Override text color            |

```yaml
- type: text
  x: 50
  y: 50
  font_size: 18
  font_family: "Inter"
  fill: "#333333"
  spans:
    - text: "Hello "
      bold: true
      fill: "#000000"
    - text: "beautiful "
      italic: true
      fill: "#E74C3C"
    - text: "world!"
      underline: true
```

---

## Color Format

Colors are CSS-style hex strings:

| Format       | Example       | Description              |
|--------------|---------------|--------------------------|
| `#RGB`       | `"#F00"`      | Short hex (red)          |
| `#RRGGBB`    | `"#FF0000"`   | Full hex (red)           |
| `#RRGGBBAA`  | `"#FF000080"` | Hex with alpha (50% red) |

Named colors are **not** supported — always use hex values.

---

## SVG Path Commands

The `d` field in `path` elements uses standard SVG path syntax:

| Command | Params              | Description                         |
|---------|---------------------|-------------------------------------|
| `M`/`m` | `x y`              | Move to (absolute/relative)         |
| `L`/`l` | `x y`              | Line to                             |
| `H`/`h` | `x`                | Horizontal line to                  |
| `V`/`v` | `y`                | Vertical line to                    |
| `C`/`c` | `x1 y1 x2 y2 x y` | Cubic Bézier                        |
| `S`/`s` | `x2 y2 x y`        | Smooth cubic Bézier                 |
| `Q`/`q` | `x1 y1 x y`        | Quadratic Bézier                    |
| `T`/`t` | `x y`              | Smooth quadratic Bézier             |
| `A`/`a` | `rx ry rot large sweep x y` | Elliptical arc              |
| `Z`/`z` | —                   | Close path                          |

Uppercase = absolute coordinates. Lowercase = relative to current point.

---

## Version History

| Version | Date       | Changes                                                    |
|---------|------------|------------------------------------------------------------|
| 0.1     | 2024-12    | Initial: rect, ellipse, line, text, path, transforms       |
| 0.2     | 2025-01    | Blend modes, filters (blur, drop-shadow)                   |
| 0.3     | 2025-02    | Defs/use, clip paths, masks                                |
| 0.4     | 2025-03    | Groups, frames, auto-layout, images, boolean ops, effects, components, multiple fills/strokes, rich text spans |
| 0.5     | 2025-04    | Full specification formalized. All features documented. Version alignment across tools and examples. |

---

## Design Principles

1. **YAML-first** — All content expressible as plain-text YAML, no binary data required
2. **SVG-compatible where possible** — Path data, color values, blend modes follow SVG/CSS conventions
3. **Declarative** — Describes *what to render*, not *how to render it*
4. **LLM-friendly** — Intuitive property names, flat structure, no implicit behavior
5. **Incrementally renderable** — Renderers may ignore unknown fields (forward compatibility)
6. **No pixel operations in format** — Visual effects (blur, shadow) are declarative; renderers implement them
7. **Backward compatible** — New versions add fields, never change existing field semantics
