/* eslint-disable */
const { execFile } = require('child_process');

exports.default = async function notarizeHook(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Defer notarization to afterAll.js to avoid blocking DMG creation
  console.log('[notarize] Skipping notarization in afterSign; will notarize after artifacts are built.');
};


