# Video Editor Documentation

This document provides a detailed overview of the video editor application, built with Electron and Lit.

## Project Structure

The project is organized into several key directories:

- **`apps`**: Contains the main application code, separated into different modules.
- **`electron`**: Houses the Electron-specific code for the main process, window management, and native integrations.
- **`docs`**: Documentation for the project.
- **`assets`**: Static assets like images, fonts, and icons.
- **`bin`**: Binary files and scripts. This directory is currently empty.
- **`packages`**: Shared packages and libraries.
- **`frontend`**: Contains the frontend code for the video editor.

### `frontend` Directory

The `frontend` directory contains the user interface for the video editor. It appears to be a modern web application, likely built with a JavaScript framework like React. The `src` directory contains the following key components:

- **`components`**: A collection of reusable UI components that make up the video editor's interface, such as `ComparisonView`, `SegmentDetail`, `SegmentList`, and `VideoPanel`.
- **`context`**: Application-wide state management for the frontend.
- **`hooks`**: Custom React hooks for managing component logic.
- **`services`**: Services for interacting with APIs and other backend functionalities.

### `packages` Directory

The `packages` directory contains the following key components:

- **`preview-engine`**: This package seems to be a placeholder or is not yet implemented, as it only contains an empty `index.ts` file.
- **`render`**: This package contains the core rendering engine for the video editor. It uses a `RenderController` to handle offscreen rendering of the timeline. The main logic is in the `offscreen-render.ts` file, which loads media, applies animations and filters, and renders each frame.

### `apps` Directory

The `apps` directory is further divided into:

- **`app`**: The core video editor application.
- **`automatic-caption`**: A separate application for generating automatic captions.
- **`overlay-record`**: An application for recording overlays.

### `electron` Directory

The `electron` directory contains the following key components:

- **`ipc`**: Handles inter-process communication between the main and renderer processes.
- **`lib`**: Core functionalities like auto-updates, FFmpeg/FFprobe integration, and window management.
- **`main.ts`**: The main entry point for the Electron application.
- **`preload.ts`**: The script that runs before the web page is loaded in the renderer process.
- **`server`**: A local web server for serving files and handling API requests.

### `apps/app/src` Directory

The heart of the video editor application resides in the `apps/app/src` directory. Here's a breakdown of its structure:

- **`components`**: Reusable UI components.
- **`context`**: Application-wide state management.
- **`controllers`**: Logic for handling user interactions and application flow.
- **`data`**: Sample data and demo files.
- **`features`**: Core features of the video editor, such as:
    - **`animation`**: Animation and keyframe interpolation.
    - **`asset`**: Asset management, including browsing, uploading, and storage.
    - **`element`**: Timeline elements and their controls.
    - **`export`**: Exporting and rendering the final video.
    - **`filter`**: Video and image filters.
    - **`keyframe`**: Keyframe editing and management.
    - **`preview`**: The main video preview canvas.
    - **`renderer`**: The rendering engine for the video editor.
    - **`timeline`**: The main timeline interface.
- **`functions`**: Utility functions.
- **`states`**: State management stores for different parts of the application.
- **`ui`**: UI-related classes and components.
- **`utils`**: General utility functions.

This is a high-level overview of the project structure. In the following sections, we will delve deeper into each of these components to understand their functionality and implementation details.
