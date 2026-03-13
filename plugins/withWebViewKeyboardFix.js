const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const OBJC_SOURCE = fs.readFileSync(
  path.join(__dirname, 'WebViewKeyboardFix.m'),
  'utf8'
);

/**
 * Expo config plugin: iOS WebView keyboard blank strip fix.
 *
 * Copies WebViewKeyboardFix.m into the Xcode project during `expo prebuild`
 * and registers it in the build target. The ObjC +load method self-registers
 * for UIKeyboardWillHideNotification and forces WKScrollView to repaint.
 */
function withWebViewKeyboardFix(config) {
  // Step 1: Write the .m file into ios/{projectName}/
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const projectName = config.modRequest.projectName;
      const iosRoot = config.modRequest.platformProjectRoot;
      const destPath = path.join(iosRoot, projectName, 'WebViewKeyboardFix.m');
      fs.writeFileSync(destPath, OBJC_SOURCE);
      return config;
    },
  ]);

  // Step 2: Add the file to the Xcode build target
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectName = config.modRequest.projectName;
    const filePath = `${projectName}/WebViewKeyboardFix.m`;

    // Avoid duplicate entries on repeated prebuild runs
    const buildFiles = xcodeProject.pbxBuildFileSection();
    const alreadyAdded = Object.values(buildFiles).some(
      (f) => f && f.fileRef_comment === 'WebViewKeyboardFix.m'
    );

    if (!alreadyAdded) {
      xcodeProject.addSourceFile(
        filePath,
        {},
        xcodeProject.getFirstTarget().uuid
      );
    }

    return config;
  });

  return config;
}

module.exports = withWebViewKeyboardFix;
