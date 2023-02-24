const webpack = require("webpack");
const path = require('path');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: 'production',

    performance: {
        hints: false,
    },

    entry: {
        head: './SPA/head.ts',
        main: './SPA/main.ts',
        pool: './SPA/pool.ts',
        "pool-account": './SPA/pool-account.ts',
        "live-dashboard": './SPA/live-dashboard.ts'
    },

    output: {
        path: path.resolve(__dirname, "wwwroot/build"),
        clean: true, // Clean the output directory before emit.
        filename: "[name].js",
        chunkFilename: "[chunkhash].js",
        publicPath: "/build/"
    },

    resolve: {
        extensions: ['.js', '.ts'],
        modules: ["node_modules"],
        alias: {
            'vue$': 'vue/dist/vue.common.js'
        }
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: ['ts-loader'],
                exclude: [path.resolve(__dirname, "node_modules"), path.resolve(__dirname, "typings")]
            },

            // HTML
            {test: /\.html$/, use: 'html-loader', exclude: [path.resolve(__dirname, "SPA/Components")],},

            // Component Templates
            {
                test: /\.html$/,
                include: [path.resolve(__dirname, "SPA/Components")],
                use: ["to-string-loader", "html-loader"]
            },

            // Other styles
            {
                test: /\.s?css$/, exclude: [path.resolve(__dirname, "SPA/components")], use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    'postcss-loader',
                    'sass-loader'
                ]
            },

            // SetupAssistants Templates
            { include: [path.resolve(__dirname, "SPA/Components/SetupAssistants/Templates")],  type: 'asset/source' },

            {test: /\.(png|jpg|svg)$/, type: 'asset/resource'},
            {test: /\.md/, use: 'markdown-it'}
        ]
    },

    plugins: [
        new MiniCssExtractPlugin(),

        new webpack.DefinePlugin({
            PRODUCTION: true,
            'process.env': {
                NODE_ENV: '"production"'
            }
        }),
    ]
}
