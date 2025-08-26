# `frontend` Directory

The `frontend` directory contains the source code for the user interface of the video editor. It's a modern web application built with React.

## Entry Point (`main.jsx`)

The entry point for the React application is `frontend/src/main.jsx`. It uses `createRoot` to render the main `App` component into the DOM.

## Application Root (`App.jsx`)

The `App.jsx` file defines the main layout of the frontend application. It's a React component that:

- Wraps the entire application in an `AuthProvider` to handle authentication.
- Renders a header with a login/logout button.
- Includes `ChatWidget` and `FlowWidget` components.
- Contains some test components and a button to add test videos to the timeline.

## Components

The `frontend/src/components` directory contains a collection of reusable React components that make up the UI of the video editor. Some of the key components include:

- **`VideoPanel.jsx`**: A component for displaying the video player. It takes a `segment` object as a prop, generates a video using the `videoApi`, and then displays it in a `<video>` element.
- **`ChatWidget.jsx`**: A widget for chat functionality.
- **`FlowWidget.jsx`**: A widget for displaying a flow diagram.
- **`SegmentDetail.jsx`** and **`SegmentList.jsx`**: Components for displaying and managing video segments.
- **`LoginLogoutButton.jsx`**: A button for logging in and out.

## Services (`api.js`)

The `frontend/src/services` directory contains the API communication logic. The `api.js` file defines a set of API wrappers for interacting with the backend. It includes functions for:

- **Authentication**: The `getAuthHeaders` function retrieves the authentication token from either `localStorage` or the Electron store.
- **Segmentation**: The `segmentationApi` object contains a function for fetching video segmentation data.
- **Image and Video Generation**: The `imageApi` and `videoApi` objects contain functions for generating images and videos.
- **S3 Integration**: The `s3Api` object contains functions for downloading images and videos from S3.
- **Other Services**: The file also includes API wrappers for other services like web-info, concept-writer, and voice generation.

This separation of concerns makes the code more organized and easier to maintain.
