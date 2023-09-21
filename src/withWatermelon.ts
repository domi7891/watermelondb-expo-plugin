import {
  withAppBuildGradle,
  withXcodeProject,
  withDangerousMod,
  withSettingsGradle,
  ExportedConfigWithProps,
} from "@expo/config-plugins";
import filesys from "fs";
import path from "path";
import resolveFrom from "resolve-from";
import { insertLinesHelper } from "./insertLinesHelper";

const fs = filesys.promises;

/**
 * Platform: Android
 *  */
function setAppBuildGradle(config: ExportedConfigWithProps) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = replace(
      config.modResults.contents,
      // @ts-ignore
      /dependencies\s{/,
      `dependencies {
\timplementation project(':watermelondb-jsi')`
    );

    return config;
  });
}

function setAppSettingBuildGradle(config: ExportedConfigWithProps) {
  return withSettingsGradle(config, (config) => {
    config.modResults.contents = config.modResults.contents.replace(
      `include ':app'`,
      `
include ':watermelondb-jsi'
project(':watermelondb-jsi').projectDir =new File(rootProject.projectDir, '../node_modules/@nozbe/watermelondb/native/android-jsi')
            
include ':app'
            `
    );

    return config;
  });
}

function setAndroidMainApplication(config: ExportedConfigWithProps) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const root = config.modRequest.platformProjectRoot;
      const filePath = `${root}/app/src/main/java/${config?.android?.package?.replace(
        /\./g,
        "/"
      )}/MainApplication.java`;

      const contents = await fs.readFile(filePath, "utf-8");

      let updated = insertLinesHelper(
        "import com.nozbe.watermelondb.WatermelonDBJSIPackage;\nimport com.facebook.react.bridge.JSIModulePackage;",
        "import java.util.List;",
        contents
      );

      updated = insertLinesHelper(
        "      @Override\n      protected JSIModulePackage getJSIModulePackage() {\n         return new WatermelonDBJSIPackage();\n      }\n",
        "      protected String getJSMainModuleName() {",
        updated,
        -1
      );

      await fs.writeFile(filePath, updated);

      return config;
    },
  ]);
}

/**
 * Platform: iOS
 *  */
function setAppDelegate(config: ExportedConfigWithProps) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        config.name.replace("-", ""),
        "AppDelegate.h"
      );
      const contents = await fs.readFile(filePath, "utf-8");

      let updated =
        `#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

// Silence warning
#import "../../node_modules/@nozbe/watermelondb/native/ios/WatermelonDB/SupportingFiles/Bridging.h"\n
            ` + contents;

      await fs.writeFile(filePath, updated);

      return config;
    },
  ]);
}

function setWmelonBridgingHeader(config: ExportedConfigWithProps) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot + "/ios",
        config.name.replace("-", ""),
        "wmelon.swift"
      );

      const contents = `
//
//  water.swift
//  watermelonDB
//
//  Created by Watermelon-plugin on ${new Date().toLocaleDateString()}.
//

import Foundation`;

      await fs.writeFile(filePath, contents);

      return config;
    },
  ]);
}

const withCocoaPods = (config: ExportedConfigWithProps) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      const contents = await fs.readFile(filePath, "utf-8");

      const watermelonPath = isWatermelonDBInstalled(
        config.modRequest.projectRoot
      );

      // patch pods before 'post_install' instruction in Podfile
      const patchKey = "post_install";
      const slicedContent = contents.split(patchKey);
      slicedContent[0] += `\n
pod 'WatermelonDB', :path => '../node_modules/@nozbe/watermelondb'
pod 'React-jsi', :path => '../node_modules/react-native/ReactCommon/jsi', :modular_headers => true
pod 'simdjson', path: '../node_modules/@nozbe/simdjson'\n\n`;

      if (watermelonPath) {
        await fs.writeFile(filePath, slicedContent.join(patchKey));
      } else {
        throw new Error("Please make sure you have watermelondb installed");
      }
      return config;
    },
  ]);
};

/**
 * Exclude building for arm64 on simulator devices in the pbxproj project.
 * Without this, production builds targeting simulators will fail.
 */
// @ts-ignore
function setExcludedArchitectures(project) {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const { buildSettings } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (
      typeof (buildSettings === null || buildSettings === void 0
        ? void 0
        : buildSettings.PRODUCT_NAME) !== "undefined"
    ) {
      buildSettings['"EXCLUDED_ARCHS[sdk=iphonesimulator*]"'] = '"arm64"';
    }
  }

  return project;
}

const withExcludedSimulatorArchitectures = (c: ExportedConfigWithProps) => {
  return withXcodeProject(c, (config) => {
    config.modResults = setExcludedArchitectures(config.modResults);
    return config;
  });
};

function isWatermelonDBInstalled(projectRoot: string) {
  const resolved = resolveFrom.silent(
    projectRoot,
    "@nozbe/watermelondb/package.json"
  );
  return resolved ? path.dirname(resolved) : null;
}

function replace(contents: string, match: string, replace: string): string {
  // @ts-ignore
  if (!(match.test ? RegExp(match).test(contents) : contents.includes(match)))
    throw new Error("Invalid text replace in config");

  return contents.replace(match, replace);
}

// @ts-ignore
export default (config) => {
  config = setAppSettingBuildGradle(config);
  config = setAppBuildGradle(config);
  config = setAndroidMainApplication(config);
  config = setAppDelegate(config);
  config = setWmelonBridgingHeader(config);
  config = withCocoaPods(config);
  config = withExcludedSimulatorArchitectures(config);
  return config;
};
