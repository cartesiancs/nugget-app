/* eslint-disable */
const { notarize } = require('@electron/notarize');
const { execFile } = require('child_process');

exports.default = async function notarizeHook(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.warn('[notarize] Missing Apple credentials; skipping notarization.');
    return;
  }

  console.log(`[notarize] Notarizing ${appPath} with notarytool (this can take a long time for first-time apps)...`);

  await notarize({
    appBundleId: 'ai.usuals.app',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
    tool: 'notarytool',
  });

  console.log('[notarize] Notarization complete, stapling ticket to app...');

  await new Promise((resolve) => {
    execFile('xcrun', ['stapler', 'staple', '-v', appPath], (error, stdout, stderr) => {
      if (error) {
        console.warn('[notarize] Stapling app failed:', stderr || error.message);
        return resolve();
      }
      console.log('[notarize] Stapling output:', stdout);
      resolve();
    });
  });

  console.log('[notarize] App stapling complete');
};


