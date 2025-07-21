# `packages` Directory

The `packages` directory contains shared packages and libraries that are used across the video editor application.

## `preview-engine`

This package appears to be a placeholder or an unused package, as it only contains an empty `index.ts` file.

## `render`

This package contains the core rendering engine for the video editor. It's a standalone Lit application that's responsible for rendering the video timeline to a canvas.

### Entry Point

The entry point for the rendering engine is `packages/render/index.html`. It loads the necessary scripts and styles for the application. The main component is `<offscreen-render>`.

### Offscreen Rendering (`offscreen-render.ts`)

The main logic for the rendering engine is in `packages/render/src/offscreen-render.ts`. The `<offscreen-render>` component is a Lit element that handles the offscreen rendering of the video timeline. It uses a `RenderController` to manage the rendering process, which includes:

- **Loading Media**: The `loadMedia` function loads all the media files (images, videos, and GIFs) used in the timeline.
- **Rendering Frames**: The `nextFrameRender` function renders each frame of the timeline to a canvas. It iterates through the timeline layers, applies animations and filters, and then draws the elements to the canvas.
- **Applying Animations**: The component includes a number of functions for applying animations, such as `getAnimateScale`, `getAnimateRotation`, and `findNearestY`.
- **Applying Filters**: The component also includes functions for applying WebGL-based filters, such as `applyChromaKey`, `applyBlur`, and `applyRadialBlur`.
- **Inter-Process Communication**: The rendered frames are sent to the main process via the `electronAPI`.

This package is a critical part of the video editor application, as it's responsible for generating the final video output.
