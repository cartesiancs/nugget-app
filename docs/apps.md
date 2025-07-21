# `apps` Directory

The `apps` directory contains the source code for the different applications that are part of the video editor suite. Each subdirectory represents a standalone application with its own `index.html`, `package.json`, and source code.

## `app`

This is the core video editor application.

### Entry Point

The entry point for the application is `apps/app/index.html`. This file loads all the necessary CSS and JavaScript files, including external libraries like Bootstrap and Socket.IO, as well as the compiled application code. The main application is rendered within the `<app-root>` custom element.

### Application Root (`<app-root>`)

The `<app-root>` element is defined in `apps/app/src/App.ts`. It's a Lit component that sets up the main layout of the video editor. It's composed of several other custom elements that provide the different functionalities of the editor:

- **`<control-ui>`**: The main control panel of the editor, likely containing the preview window and other controls.
- **`<timeline-ui>`**: The timeline interface for arranging and editing video clips.
- **`<chat-sidebar>`**: A sidebar for chat functionality.
- **`<asset-upload-drop>`**: A component for handling asset uploads via drag and drop.
- **`<tutorial-group>`**: A component for displaying tutorials.
- **`<offcanvas-list-ui>`**, **`<modal-list-ui>`**, **`<toast-list-ui>`**: Components for displaying off-canvas menus, modals, and toasts.

The layout is responsive, with the different sections resizing based on the application's state, which is managed by the `uiStore`.

### Initialization

The application is initialized in `apps/app/src/index.ts`. This file imports and registers all the custom elements that are used in the application. This includes UI components, features, and context providers.

## `automatic-caption`

This application provides the functionality for automatically generating captions for videos.

### Entry Point

The entry point is `apps/automatic-caption/index.html`. It loads the necessary scripts and styles for the application. The main component is `<simple-app>`.

### Application Logic

The main logic is in `apps/automatic-caption/src/app.ts`. The `<simple-app>` component renders an `<automatic-caption>` element, which is responsible for the actual captioning functionality. It takes a timeline object as input, which contains the information about the video to be captioned.

## `overlay-record`

This application is responsible for recording a webcam feed as an overlay.

### Entry Point

The entry point is `apps/overlay-record/index.html`. It loads the necessary scripts and styles for the application. The main component is `<overlay-webcam>`.

### Application Logic

The main logic is in `apps/overlay-record/src/overlay-webcam.ts`. The `<overlay-webcam>` component is a Lit element that displays the user's webcam feed in a circular overlay at the bottom-left of the screen. It communicates with the Electron main process via the `electronAPI` to stop the recording.
