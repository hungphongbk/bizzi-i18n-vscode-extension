/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

"use strict";

const path = require("path");
const merge = require("merge-options");
const TerserPlugin = require("terser-webpack-plugin");

const isProduction =
  process.argv[process.argv.indexOf("--mode") + 1] === "production";
console.log(isProduction ? "is production" : "fuck");

module.exports = function withDefaults(/**@type WebpackConfig*/ extConfig) {
  /** @type WebpackConfig */
  let defaultConfig = {
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: "node", // extensions run in a node context
    node: {
      __dirname: false, // leave the __dirname-behaviour intact
    },
    resolve: {
      mainFields: ["module", "main"],
      extensions: [".ts", ".js"], // support ts-files and js-files
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: "swc-loader",
            options: {
              jsc: {
                parser: {
                  syntax: "typescript",
                  decorators: true,
                },
              },
            },
          },
        },
        {
          test: /\.svg$/,
          loader: "svg-url-loader",
          options: {
            // make loader to behave like url-loader, for all svg files
            encoding: "base64",
          },
        },
        {
          test: /\.svg$/,
          loader: "svg-url-loader",
          options: {
            // make loader to behave like url-loader, for all svg files
            encoding: "base64",
          },
        },
      ],
    },
    externals: {
      vscode: "commonjs vscode", // ignored because it doesn't exist
    },
    output: {
      // all output goes into `dist`.
      // packaging depends on that and this must always be like it
      filename: "[name].js",
      // @ts-ignore
      path: path.join(extConfig.context, "out"),
      libraryTarget: "commonjs",
    },
    // yes, really source maps
    devtool: "inline-source-map",
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          minify: TerserPlugin.swcMinify,
          // `terserOptions` options will be passed to `swc` (`@swc/core`)
          // Link to options - https://swc.rs/docs/config-js-minify
        }),
      ],
    },
  };

  return merge(defaultConfig, extConfig);
};
