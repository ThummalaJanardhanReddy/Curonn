const {
  withInfoPlist,
  withAppDelegate,
  withDangerousMod,
  withXcodeProject,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Fixes a fatal launch crash ("UIKitCore: ___UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption")
// seen on newer iOS versions by adopting the UIWindowScene lifecycle instead of the
// legacy window-based AppDelegate lifecycle. Deep-link / universal-link handling is
// mirrored onto the scene delegate so Razorpay redirects and expo-router links keep working.

const SCENE_DELEGATE_SOURCE = `import UIKit
import React

public class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  public var window: UIWindow?

  public func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }

    let window = UIWindow(windowScene: windowScene)
    appDelegate.window = window
    self.window = window

    appDelegate.reactNativeFactory?.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: nil)
  }

  public func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let url = URLContexts.first?.url else { return }
    RCTLinkingManager.application(UIApplication.shared, open: url, options: [:])
  }

  public func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }
}
`;

function withSceneManifest(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
    };
    return config;
  });
}

function withSceneDelegateFile(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjectName = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
      const targetDir = path.join(config.modRequest.platformProjectRoot, iosProjectName);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'SceneDelegate.swift'), SCENE_DELEGATE_SOURCE);
      return config;
    },
  ]);
}

function withSceneDelegateXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
    IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
      filepath: `./${projectName}/SceneDelegate.swift`,
      groupName: projectName,
      project: config.modResults,
    });
    return config;
  });
}

function withSceneDelegateAppDelegate(config) {
  return withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    // The SceneDelegate now owns window creation + React Native startup.
    contents = contents.replace(/\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n/, '\n');
    contents = contents.replace(
      /\s*factory\.startReactNative\(\s*withModuleName: "main",\s*in: window,\s*launchOptions: launchOptions\)\n/,
      '\n'
    );

    if (!contents.includes('configurationForConnecting')) {
      contents = contents.replace(
        /\n}\n\nclass ReactNativeDelegate/,
        `
  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let sceneConfig = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    sceneConfig.delegateClass = SceneDelegate.self
    return sceneConfig
  }
}

class ReactNativeDelegate`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withSceneDelegate(config) {
  config = withSceneManifest(config);
  config = withSceneDelegateFile(config);
  config = withSceneDelegateXcodeProject(config);
  config = withSceneDelegateAppDelegate(config);
  return config;
};
