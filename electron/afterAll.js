/* eslint-disable */
const { execFile } = require('child_process');
const path = require('path');

exports.default = async function afterAllHook(context) {
  // Make resilient to varying hook payloads across electron-builder versions
  const maybeArray = (val) => (Array.isArray(val) ? val : []);
  const artifactsFromContext = context ? (context.artifacts || context.artifactPaths || context.files) : [];
  const artifactPaths = maybeArray(artifactsFromContext);

  let dmgPaths = artifactPaths.filter((a) => typeof a === 'string' && a.endsWith('.dmg'));

  if (dmgPaths.length === 0) {
    // Nothing to do
    console.log('[afterAll] No DMG artifacts found to staple.');
    return;
  }

  // If Apple credentials are not set (e.g., local signed-only build), skip stapling
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) {
    console.log('[afterAll] Apple credentials not set; skipping DMG stapling.');
    return;
  }

  // Only staple DMGs here (notarization, if any, runs during afterSign)
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


