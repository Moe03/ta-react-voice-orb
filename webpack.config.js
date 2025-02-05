const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
// const removeDuplicates = require("./remove-dups.js"); // Adjust the path as necessary
const path = require("path");
// const million = require("million/compiler");
// const { millionConfig } = require('./next.config.js');
const webpack = require("webpack");
// const AddImportantPlugin = require("./add-important-styles.js"); // Import the custom plugin

module.exports = (env) => {
  const dir = env.dir || `/tmp/replace_me`;

  return {
    mode: "production",
    entry: "./src/app/Components/root_build.js",
    output: {
      path: dir,
      filename: "vg_bundle.js",
    },
    resolve: {
      alias: {
        "@vg-edge": path.resolve(__dirname, "vg-edge"),
        "@main": path.resolve(__dirname, "vg-docker/src"),
        "@monorepo": path.resolve(__dirname),
        "@": path.resolve(__dirname, "src"),
        "@server": path.resolve(__dirname, "vg-docker"),
        "@nextui-org/react": path.resolve(
          __dirname,
          `src`,
          `nextui-fork`,
          `nextui`,
          `packages`,
          `core`,
          `react`
        ),
        "@nextui-org/theme": path.resolve(
          __dirname,
          `src`,
          `nextui-fork`,
          `nextui`,
          `packages`,
          `core`,
          `theme`
        ),
        react: path.resolve(__dirname, `node_modules`, `react`),
        // "react-dom/test-utils": "preact/test-utils",
        "react-dom": path.resolve(__dirname, `node_modules`, `react-dom`),
        // "react/jsx-runtime": "preact/jsx-runtime"
      },
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
              "next/babel",
            ],
            plugins: [
              "./babel-react-prefix-classnames.js",
              // ["@babel/plugin-transform-react-jsx", {
              //   "pragma": "h",
              //   "pragmaFrag": "Fragment",
              // }]
            ],
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [
                    require("autoprefixer"),
                    require("tailwindcss"),
                    require("postcss-prefixer")({
                      prefix: "vg-",
                    }),
                    require("postcss-selector-namespace")({
                      namespace: ".vg-render-container", // Replace with your desired ID
                    }),
                    // require('postcss-safe-important')(), // This will add !important to all styles
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            // Enable/disable options as needed
            compress: {
              drop_console: true, // Remove console.* calls
            },
            output: {
              comments: false, // Remove comments
            },
          },
          extractComments: false, // Don't extract comments to a separate file
        }),
        new CssMinimizerPlugin(),
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "styles.css",
      }),
      new AddImportantPlugin(), // Add the custom plugin
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify("production"),
          WORKER_ENV: JSON.stringify("production"),
        },
      }),
      // million.webpack({
      //   auto: {
      //     rsc: true,
      //     threshold: 0.25, // default: 0.1,
      //     skip: [/nextui/g],
      //     mute: true
      //   },
      //   mute: true
      // })
    ],
  };
};
