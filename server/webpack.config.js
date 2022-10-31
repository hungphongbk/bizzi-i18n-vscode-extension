/* eslint-disable @typescript-eslint/naming-convention */
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check

"use strict";

const withDefaults = require("../shared.webpack.config");
const path = require("path");
const { TsconfigPathsPlugin } = require("tsconfig-paths-webpack-plugin");
const WebpackBuildNotifierPlugin = require("webpack-build-notifier");

const isProduction =
  process.argv[process.argv.indexOf("--mode") + 1] === "production";

module.exports = withDefaults({
  context: path.join(__dirname),
  entry: {
    extension: "./src/i18n-server.ts",
  },
  resolve: {
    symlinks: false,
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
  },
  output: {
    filename: "server.js",
    path: path.join(__dirname, "out"),
  },
  plugins: [
    !isProduction &&
      // @ts-ignore
      new WebpackBuildNotifierPlugin({
        title: "Bizzi I18n Server",
        suppressSuccess: true,
      }),
  ].filter(Boolean),
});
