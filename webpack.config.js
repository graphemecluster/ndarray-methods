// @ts-check

require("ts-node/register");
const path = require("path");

/** @type { import("typescript").SourceFile } */
let mainAST;

module.exports = /** @satisfies { import("webpack").Configuration } */ ({
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
            /** @satisfies { import("typescript").CustomTransformers } */ ({
              afterDeclarations: [
                () => node => {
                  /** @type { (node: unknown) => asserts node is import("typescript").SourceFile } */ function assertSourceFile() {}
                  assertSourceFile(node);
                  if (!mainAST && node.fileName.endsWith("main.ts")) return (mainAST = node);
                  else if (mainAST && node.fileName.endsWith("polyfill.ts"))
                    return require("./scripts/transform").default(mainAST, node);
                  else return node;
                },
              ],
            }),
        },
      },
    ],
  },
  devtool: "source-map",
});
