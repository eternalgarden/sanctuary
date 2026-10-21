/*

Core taken from: fast documentation on integration with webpack
at : https://www.fast.design/docs/integrations/webpack/

Extended with: Functionality to generate multiple html files

*/

/* REQUIRES */

// basics
const path = require("path")
const webpack = require("webpack")

// cleaner as recommended by FAST: https://www.fast.design/docs/integrations/webpack/
const { CleanWebpackPlugin } = require("clean-webpack-plugin")

// so this thing will allow to have multiple html files exported
// not sure if that is the best way to do it but it works
// since in sanctuary-ui i will need a series of disconnected views that are kinda webpages on their own
const HtmlWebpackPlugin = require("html-webpack-plugin")

const htmlMinifyOptions = {
    collapseWhitespace: false,
    removeComments: true,
    removeRedundantAttributes: true,
    removeStyleLinkTypeAttributes: false,
    removeScriptTypeAttributes: false,
    useShortDoctype: true,
}

const MiniCssExtractPlugin = require("mini-css-extract-plugin")

// as explained at: https://stackoverflow.com/questions/39798095/multiple-html-files-using-webpack

/* below was an attempt to automatically generate separate HtmlWebpackPlugin 
pages through maintaining a specific folder layout */
// let htmlPageNames = ['blue', 'orange'];
// let multipleHtmlPlugins = htmlPageNames.map(name => {
//   return new HtmlWebpackPlugin({
//     template: `./src/components/${name}/${name}.html`, // relative path to the HTML files
//     filename: `${name}.html`, // output HTML files
//     chunks: [`${name}`] // respective JS files
//   })
// });

// Neo: gdcef loads the build straight from the Godot project as res://moon/browser/dist/...
const DIST_PATH = path.resolve(__dirname, "../src/moon/browser/dist")
const HOT_UPDATES_ABSOLUTE_PATH = path.resolve(__dirname, "hot-updates")
const HOT_UPDATES_RELATIVE_PATH = path.relative(
    DIST_PATH,
    HOT_UPDATES_ABSOLUTE_PATH
)

module.exports = function (env, { mode }) {
    const production = mode === "production" // production or development

    console.log("WEBPACK MODE:", mode, "PRODUCTION:", production)

    return {
        mode: production ? "production" : "development",

        // https://webpack.js.org/configuration/devtool/
        devtool: production ? "source-map" : "eval",

        context: path.resolve(__dirname, "src"),

        // https://webpack.js.org/configuration/entry-context/#entry
        entry: {
            // * u might be really interested in CodeSplitting at some moment
            // https://webpack.js.org/guides/code-splitting/
            note: "./components/note/note.ts",
            // Neo: the views below are not migrated yet, only the note is wired into Godot
            // eris: "./eris/eris.ts",
            // editorFairy: "./components/editor-fairy/editor-fairy.ts",
            // gbob: "./components/gbob/gbob.ts",
            // fullscreenViewer:
            //     "./components/fullscreenViewer/fullscreenViewer.ts",
        },

        output: {
            filename: "[name].bundle.js",
            path: DIST_PATH,
            // clean: true, // ? not sure about this option, see CleanWebpackPlugin below
            hotUpdateChunkFilename: path.join(
                HOT_UPDATES_RELATIVE_PATH,
                "[id].[hash].hot-update.js"
            ),
            hotUpdateMainFilename: path.join(
                HOT_UPDATES_RELATIVE_PATH,
                "[hash].hot-update.json"
            ),
        },

        // * splitting optimization
        optimization: {
            runtimeChunk: "single",
            //   splitChunks:
            //   {
            //     chunks: 'all',
            //   },
        },
        resolve: {
            extensions: [".ts", ".js", ".css"],
            modules: ["src", "node_modules"],
        },
        devServer: {
            port: 9001,
            historyApiFallback: true,
            open: false,
            devMiddleware: {
                writeToDisk: true,
            },
            static: {
                // directory: path.resolve(__dirname, "sanctuary-ui-dev"),
                directory: DIST_PATH,
                watch: true
            },
            watchFiles: {
                paths: ['src/**/*'],
                options: {
                    ignored: '**/node_modules/**',
                    followSymlinks: false,
                },
            },
        },

        /*🦞 PLUGINS ⛈️ */
        plugins: [
            new webpack.ProgressPlugin(),
            new CleanWebpackPlugin({
                // 🧹 MESS PREVENTION SYSTEM 🌋
                // keep ur room tidy
                // this simply cleans up the unused file mess webpack would otherwise create
                // https://github.com/johnagan/clean-webpack-plugin
                // using this plugin because below option doesnt clean hot-update files
                // https://webpack.js.org/guides/output-management/#cleaning-up-the-dist-folder
                // to see what happens without it just comment out this plugin, run dev server and spamm ctrl+s in your ide a few times and then take a peek into your webpack output directory
                dry: false,
                verbose: true,
                dangerouslyAllowCleanPatternsOutsideProject: true,
                cleanStaleWebpackAssets: true,
                cleanOnceBeforeBuildPatterns: [
                    DIST_PATH,
                    HOT_UPDATES_ABSOLUTE_PATH,
                ],
            }),
            new HtmlWebpackPlugin({
                filename: "note.html",
                template: "./components/note/note.html",
                title: "Hello Note",
                minify: htmlMinifyOptions,
                chunks: ["note"],
            }),
            // Neo: not migrated yet, see entries above
            // new HtmlWebpackPlugin({
            //     filename: "eris.html",
            //     template: "./eris/eris.html",
            //     minify: htmlMinifyOptions,
            //     chunks: ["eris"],
            // }),
            // new HtmlWebpackPlugin({
            //     filename: "editor-fairy.html",
            //     template: "./components/editor-fairy/editor-fairy.html",
            //     minify: htmlMinifyOptions,
            //     chunks: ["editorFairy"],
            // }),
            // new HtmlWebpackPlugin({
            //     filename: "gbob.html",
            //     template: "./components/gbob/gbob.html",
            //     minify: htmlMinifyOptions,
            //     chunks: ["gbob"],
            // }),
            // new HtmlWebpackPlugin({
            //     filename: "fullscreenViewer.html",
            //     template:
            //         "./components/fullscreenViewer/fullscreenViewer.html",
            //     minify: htmlMinifyOptions,
            //     chunks: ["fullscreenViewer"],
            // }),
            /* Does that even work, what does it do, maria goddamnit you should have left comments. */
            new MiniCssExtractPlugin({
                filename: "[name].css",
            }),
            // Neo: keeps the Godot editor from importing the build's fonts and images as
            // resources. gdcef reads the raw files through res:// regardless.
            {
                apply: compiler =>
                    compiler.hooks.thisCompilation.tap("GdIgnore", compilation =>
                        compilation.hooks.processAssets.tap(
                            "GdIgnore",
                            () => compilation.emitAsset(
                                ".gdignore",
                                new webpack.sources.RawSource("")
                            )
                        )
                    ),
            },
        ],

        module: {
            /* 👽 rules for handling various filetypes 🕷️ */
            rules: [
                {
                    test: /\.ts$/i,
                    use: [
                        {
                            loader: "ts-loader",
                        },
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    resourceQuery: { not: [/raw/] },
                    use: [
                        {
                            // ugh
                            // https://stackoverflow.com/questions/59360348/create-link-tag-for-webpack-mini-css-extract-plugin-extracted-file-without-html
                            loader: MiniCssExtractPlugin.loader,
                        },
                        "css-loader",
                        "postcss-loader",
                    ],
                },
                // Loads raw CSS
                {
                    test: /\.css$/,
                    resourceQuery: /raw/,
                    type: "asset/source",
                },
                {
                    test: /\.html$/,
                    resourceQuery: /raw/,
                    type: "asset/source",
                },
                {
                    test: /\.(woff|woff2|ttf|otf)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "public/fonts/[name][ext][query]",
                    },
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "public/images/[name][ext][query]",
                    },
                },
                {
                    test: /\.json/,
                    type: "asset/source",
                    generator: {
                        filename: "public/test-data/[name][ext][query]",
                    },
                },
            ],
        },
    }
}
