# NewPNG

**AI-native text-to-design for editable, lossless, Figma-like vector graphics.**

AI image generators can create a beautiful first draft, but the result is usually a flat bitmap. If the text is wrong, the layout is almost right, or one color needs to change, you are often forced to prompt again and hope.

NewPNG takes a different path: **AI generates editable design source**. The image is stored as structured `npng` YAML, rendered as vector graphics, and refined in a Figma-like editor.

> **Generate with AI. Edit it like a design file. Ship the source, not blurry pixels.**

## Try it

| Destination | URL |
|---|---|
| Product landing page | https://nextpng.org |
| Design studio | https://nextpng.org/editing |
| Online npng viewer | https://nextpng.org/viewer |
| AI generation guide | https://github.com/jacobjiangwei/newPNG/blob/main/spec/AI_GENERATION_GUIDE.md |
| npng format spec | https://github.com/jacobjiangwei/newPNG/blob/main/spec/npng-v3.md |

## Why NewPNG exists

Most AI image workflows end with pixels. NewPNG is built for the moment when the AI result is already 80% right and you just want to adjust it:

- Change the headline without regenerating the whole image.
- Move one layer, icon, card, or decoration.
- Edit colors, strokes, shadows, gradients, and text boxes.
- Inspect and modify the source in Git-friendly text.
- Export a sharp PNG at higher resolution.

The mission is:

> **Figma-like visual expression + text-native generation/transmission + AI-native editing.**

NewPNG is not trying to be a Mermaid flowchart clone, and it is not a Photoshop-style raster editor. It is a text-native design format and editor for structured visuals: UI mockups, icons, posters, cards, banners, logos, product visuals, technical illustrations, and infographics.

## What makes npng different

| Bitmap AI output | NewPNG source |
|---|---|
| Flat pixels | Layered vector structure |
| Hard to edit precisely | Text, shapes, paths, layers, and styles stay editable |
| Scaling can blur | Re-render at any DPI |
| Difficult to diff | YAML is Git-friendly |
| Expensive to transmit as image data | Copy/paste compact text source |
| Prompt again for small changes | Modify the object or ask AI to patch the source |

## How it works

```text
Prompt or npng YAML
        ↓
AI generates structured design source
        ↓
Canvas renders layered vector graphics
        ↓
Human edits visually or in YAML
        ↓
Export sharp PNG or share .npng text
```

A tiny example:

```yaml
npng: "0.3"
canvas:
  width: 640
  height: 360
  background: "#0B1020"
layers:
  - name: hero card
    elements:
      - type: rect
        name: Glass panel
        x: 80
        y: 70
        width: 480
        height: 220
        rx: 28
        fill: "#FFFFFF14"
        stroke:
          color: "#FFFFFF30"
          width: 1
      - type: text
        name: Editable headline
        x: 120
        y: 130
        width: 400
        content: "AI-made. Human-editable."
        font_size: 34
        font_weight: bold
        line_height: 1.15
        fill: "#FFFFFF"
```

## Current editor capabilities

The web app in `web/` is the main deliverable.

- **Text-to-design AI**: Claude can generate npng YAML from natural-language prompts.
- **Figma-like canvas editing**: select, move, resize, rotate, group, ungroup, lock, and reorder objects.
- **Layer panel**: visual top-to-bottom ordering, layer visibility, layer locks, object locks.
- **Vector tools**: rectangle, ellipse, line, text, Vector Pen, polyline, polygon, star, arrow, image, and frame tools.
- **Text boxes**: wrapping, width, line height, fill, stroke, and editable content.
- **Path node editing**: drag anchors/handles, insert anchors, delete anchors.
- **Renderer**: layers, groups, defs/use, gradients, strokes, multi-fills, multi-strokes, transforms, opacity, blend modes, filters, masks, clips, text stroke.
- **Export and share**: `.npng` source download, high-DPI PNG export at 1x, 2x, or 4x, local project versions, and URL-based viewer sharing.
- **Online viewer**: `/viewer` opens pasted, uploaded, or shared `.npng` source without entering the full Studio.

## Product direction

The next milestones are about making AI-generated design source feel more like a real design file:

1. **AI edit loop**: tell the assistant to modify the current npng instead of replacing the whole design.
2. **Richer Figma-like layout**: frames, constraints, auto layout, padding, gap, hug/fill behavior.
3. **Reusable design systems**: components, instances, variants, color styles, text styles, effect styles.
4. **Stronger vector operations**: boolean operations UI, compound paths, outline stroke, flatten, corner smoothing.
5. **Better source portability**: compact/minified npng, copy links, import/export helpers, schemas, and editor integrations.

## Contribute

Contributions are welcome. NewPNG is still early, and there is a lot of room to shape both the product and the format.

Good contribution areas:

- **Editor UX**: Figma-like interactions, selection behavior, layer workflows, property panels, keyboard shortcuts.
- **Renderer fidelity**: Canvas rendering correctness, export quality, text layout, gradients, filters, masks, blend modes.
- **npng format design**: specs for components, auto layout, constraints, styles, variants, effects, and portability.
- **AI generation quality**: prompts, examples, structured generation patterns, current-document edit loops.
- **Examples**: beautiful `.npng` files that show what text-native design source can express.
- **Import/export tools**: SVG conversion, compact npng, source sharing, validation, linting.
- **Docs and demos**: tutorials, screenshots, use cases, comparison examples, and product messaging.

If you are not sure where to start, open an issue with what you want to improve. Design-minded contributors, renderer engineers, TypeScript/React developers, AI prompt engineers, and people who just want to make great examples are all welcome.

## Repository structure

```text
newPNG/
├── web/                  # Next.js web app and main product
│   ├── src/app/          # Landing page, /editing studio, API route
│   ├── src/components/   # Canvas, toolbar, layer panel, editor panels
│   └── src/lib/          # npng renderer, editor state, hit testing, path tools
├── spec/                 # npng format specification and roadmap
├── examples/             # Example .npng files
├── renderer/             # Original Python renderer reference
├── tools/                # Utility scripts
└── vscode-extension/     # VS Code language support for .npng files
```

## Development

```bash
cd web
npm install
npm run dev
```

Build before pushing to `main`:

```bash
cd web
npm run build
```

Every push to `main` deploys the website to Azure App Service:

https://newpng.azurewebsites.net

The custom production domain is:

https://nextpng.org
