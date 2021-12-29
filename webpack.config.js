const path = require("path");

/** @type { import("webpack").Configuration } */
module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "index.js",
    library: "NDArray",
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
  },
  resolve: {
    extensions: [".ts"],
  },
  module: {
    rules: [{ test: /\.ts$/i, use: "ts-loader" }],
  },
  devtool: "source-map",
};
