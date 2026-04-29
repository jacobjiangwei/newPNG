# npng-renderer

Render [npng](https://nextpng.org) vector graphics to Canvas 2D or SVG.

**npng** is an AI-native, human-readable YAML vector graphics format. Think "Markdown for design."

## Install

```bash
npm install npng-renderer js-yaml
```

## Quick Start

### Render to Canvas 2D

```ts
import yaml from "js-yaml";
import { renderNpng, preloadNpngImages } from "npng-renderer";
import type { NpngDocument } from "npng-renderer";

const yamlString = `
npng: "0.3"
canvas:
  width: 400
  height: 300
  background: "#FFFFFF"
layers:
  - name: "Main"
    elements:
      - type: rect
        x: 50
        y: 50
        width: 200
        height: 100
        fill: "#FF6B6B"
        corner_radius: 12
      - type: text
        x: 100
        y: 110
        content: "Hello npng!"
        font_size: 24
        fill: "#FFFFFF"
`;

const doc = yaml.load(yamlString) as NpngDocument;
const canvas = document.getElementById("myCanvas") as HTMLCanvasElement;

// Preload images & fonts, then render
await preloadNpngImages(doc);
renderNpng(canvas, doc, { pixelRatio: window.devicePixelRatio });
```

### Convert to SVG

```ts
import yaml from "js-yaml";
import { npngToSvg } from "npng-renderer";
import type { NpngDocument } from "npng-renderer";

const doc = yaml.load(yamlString) as NpngDocument;
const svgString = npngToSvg(doc);
// Use as innerHTML or save to file
```

## Supported Element Types

| Type | Description |
|------|-------------|
| `rect` | Rectangle with optional corner radius |
| `ellipse` | Ellipse / circle |
| `line` | Line with optional arrows |
| `path` | SVG path commands |
| `text` | Single/multi-line text |
| `group` | Element container |
| `frame` | Clipped container (like Figma frames) |
| `image` | Embedded or linked images |
| `boolean` | Boolean operations (union/subtract/intersect/exclude) |
| `use` | Reference to defs |

## Features

- **Gradients** — Linear and radial gradients with multiple stops
- **Transforms** — Translate, rotate, scale, skew
- **Blend modes** — All CSS blend modes
- **Filters** — Blur, brightness, contrast, etc.
- **Effects** — Drop shadow, inner shadow, outer glow
- **Clip paths** — Element-based clipping
- **Components** — Defs/use pattern + component instances
- **Auto layout** — Flexbox-like layout for groups/frames
- **Boolean operations** — Union, subtract, intersect, exclude

## Format Spec

See the [npng format specification](https://github.com/jacobjiangwei/nextPNG/blob/main/spec/npng-v3.md).

## License

MIT
