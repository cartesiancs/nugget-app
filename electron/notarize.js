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

  const useApiKey = !!(process.env.NOTARYTOOL_KEY_ID && process.env.NOTARYTOOL_ISSUER_ID && process.env.NOTARYTOOL_KEY_FILE);

  if (!useApiKey && (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID)) {
    console.warn('[notarize] Missing Apple credentials; skipping notarization.');
    return;
  }

  console.log(`[notarize] Notarizing ${appPath} with notarytool via ${useApiKey ? 'API key' : 'Apple ID'} (this can take a while)...`);

  const options = {
    appBundleId: 'ai.usualsapp',
    appPath,
    tool: 'notarytool',
  };

  if (useApiKey) {
    options.keyId = process.env.NOTARYTOOL_KEY_ID;
    options.issuerId = process.env.NOTARYTOOL_ISSUER_ID;
    options.key = process.env.NOTARYTOOL_KEY_FILE;
  } else {
    options.appleId = process.env.APPLE_ID;
    options.appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
    options.teamId = process.env.APPLE_TEAM_ID;
  }

  try {
    await notarize(options);
  } catch (err) {
    const message = (err && (err.message || err.toString())) || '';
    const idMatch = message.match(/"id"\s*:\s*"([0-9a-fA-F-]+)"/);
    const jobId = idMatch ? idMatch[1] : null;
    if (jobId) {
      console.warn(`[notarize] Submission failed. Fetching notarytool log for jobId ${jobId}...`);
      await new Promise((resolve) => {
        const args = ['notarytool', 'log', jobId];
        if (useApiKey) {
          args.push('--key-id', process.env.NOTARYTOOL_KEY_ID, '--issuer', process.env.NOTARYTOOL_ISSUER_ID, '--key', process.env.NOTARYTOOL_KEY_FILE);
        } else {
          args.push('--apple-id', process.env.APPLE_ID, '--password', process.env.APPLE_APP_SPECIFIC_PASSWORD, '--team-id', process.env.APPLE_TEAM_ID);
        }
        require('child_process').execFile('xcrun', args, (e, stdout, stderr) => {
          console.log(stdout || '');
          if (stderr) console.warn(stderr);
          resolve();
        });
      });
    }
    throw err;
  }

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


