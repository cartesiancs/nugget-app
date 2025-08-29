/* eslint-disable */
const { execFile } = require('child_process');
const path = require('path');

exports.default = async function afterAllHook(context) {
  const { artifacts } = context;
  const dmgPaths = artifacts.filter((a) => typeof a === 'string' && a.endsWith('.dmg'));

  // Only staple DMGs here (notarization runs during afterSign)
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


