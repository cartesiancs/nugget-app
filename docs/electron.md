# `electron` Directory

The `electron` directory contains the source code for the main Electron process. It's responsible for managing the application's lifecycle, creating windows, handling inter-process communication (IPC), and integrating with native functionalities.

## Main Entry Point (`main.ts`)

The main entry point for the Electron application is `electron/main.ts`. This file is responsible for:

- **Initializing the application**: It sets up the application's environment, including loading environment variables and configuring logging.
- **Creating the main window**: It calls the `createMainWindow` function from the `window` library to create the main application window.
- **Handling application events**: It listens for application events like `ready`, `window-all-closed`, and `second-instance`.
- **Setting up IPC listeners**: It sets up a large number of IPC listeners to handle communication from the renderer process. These listeners are organized into different modules within the `ipc` directory.
- **Managing auto-updates**: It integrates with `electron-updater` to handle automatic updates.
- **Handling deep linking**: It sets up a custom protocol client to handle deep linking.

## Inter-Process Communication (`ipc`)

The `ipc` directory contains a collection of modules that handle inter-process communication between the main and renderer processes. Each module is responsible for a specific set of functionalities, such as:

- **`ipcFilesystem.ts`**: Handles file system operations like reading, writing, and deleting files and directories.
- **`ipcDialog.ts`**: Handles opening native file and directory selection dialogs.
- **`ipcStore.ts`**: Handles storing and retrieving data from the local application store.
- **`ipcStream.ts`**: Handles saving and processing data streams.
- **`ipcMedia.ts`**: Handles media-related operations like background removal.
- **`ipcTimeline.ts`**: Handles timeline-related operations.

This modular approach to IPC makes the code more organized and easier to maintain.

## Core Functionalities (`lib`)

The `lib` directory contains a collection of modules that encapsulate the application's core functionalities:

- **`window.ts`**: Responsible for creating and configuring all the different windows used in the application, including the main window, the overlay recording window, and the offscreen rendering window.
- **`ffmpeg.ts`** and **`ffprobe.ts`**: Provide an interface for interacting with the FFmpeg and FFprobe command-line tools.
- **`font.ts`**: Handles loading and managing fonts.
- **`autoUpdater.ts`**: Encapsulates the logic for handling automatic updates.
- **`menu.ts`**: Defines the application's main menu.

This separation of concerns makes the code more modular and reusable.
