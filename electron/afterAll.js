/* eslint-disable */
const { execFile } = require('child_process');
const path = require('path');

exports.default = async function afterAllHook(context) {
  const { artifacts } = context;
  const appPaths = artifacts.filter((a) => typeof a === 'string' && a.endsWith('.app'));
  const dmgPaths = artifacts.filter((a) => typeof a === 'string' && a.endsWith('.dmg'));

  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.warn('[afterAll] Missing Apple credentials; skipping notarization and stapling.');
    return;
  }

  // Notarize each .app with notarytool
  for (const appPath of appPaths) {
    await new Promise((resolve) => {
      const args = [
        'altool',
        '--notarize-app',
        '--primary-bundle-id',
        'ai.usuals.app',
        '--username',
        process.env.APPLE_ID,
        '--password',
        process.env.APPLE_APP_SPECIFIC_PASSWORD,
        '--asc-provider',
        process.env.APPLE_TEAM_ID,
        '--file',
        appPath,
      ];
      // Prefer notarytool if available
      execFile('xcrun', ['notarytool', 'submit', appPath, '--apple-id', process.env.APPLE_ID, '--password', process.env.APPLE_APP_SPECIFIC_PASSWORD, '--team-id', process.env.APPLE_TEAM_ID, '--wait'], (error, stdout, stderr) => {
        if (error) {
          console.warn(`[afterAll] Notarization failed for ${path.basename(appPath)}:`, stderr || error.message);
          return resolve();
        }
        console.log(`[afterAll] Notarized app: ${path.basename(appPath)}`);
        console.log(stdout);
        resolve();
      });
    });

    // Staple the .app
    await new Promise((resolve) => {
      execFile('xcrun', ['stapler', 'staple', '-v', appPath], (error, stdout, stderr) => {
        if (error) {
          console.warn(`[afterAll] Stapling app failed for ${path.basename(appPath)}:`, stderr || error.message);
          return resolve();
        }
        console.log(`[afterAll] Stapled app: ${path.basename(appPath)}`);
        console.log(stdout);
        resolve();
      });
    });
  }

  // Staple DMGs
  await Promise.all(
    dmgPaths.map(
      (dmgPath) =>
        new Promise((resolve) => {
          execFile('xcrun', ['stapler', 'staple', '-v', dmgPath], (error, stdout, stderr) => {
            if (error) {
              console.warn(`[afterAll] Stapling DMG failed for ${path.basename(dmgPath)}:`, stderr || error.message);
              return resolve();
            }
            console.log(`[afterAll] Stapled DMG: ${path.basename(dmgPath)}`);
            console.log(stdout);
            resolve();
          });
        })
    )
  );
};


