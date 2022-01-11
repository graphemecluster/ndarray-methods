const path = require("path");

/** @type { import("typescript").SourceFile } */
let mainAST;

/** @type { import("webpack").Configuration } */
module.exports = {
  mode: "production",
  entry: {
    index: {
      import: "./src/index.ts",
      library: {
        name: "NDArray",
        type: "umd",
        umdNamedDefine: true,
      },
    },
    polyfill: {
      import: "./src/polyfill.ts",
      library: {
        name: "!",
        type: "jsonp",
      },
    },
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "[name].js",
    globalObject: "this",
  },
  resolve: {
    extensions: [".ts"],
  },
  target: ["web", "es5"],
  module: {
    rules: [
      {
        test: /\.ts$/i,
        loader: "ts-loader",
        options: {
          getCustomTransformers: () =>
            /** @type { import("typescript").CustomTransformers } */ ({
              afterDeclarations: [
                function () {
                  return function (node) {
                    if (!mainAST && node.fileName.endsWith("main.ts")) return (mainAST = node);
                    else if (mainAST && node.fileName.endsWith("polyfill.ts"))
                      return require("./scripts/transform").default(mainAST, node);
                    else return node;
                  };
                },
              ],
            }),
        },
      },
    ],
  },
  devtool: "source-map",
};
