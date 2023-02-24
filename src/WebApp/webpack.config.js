const webpack = require("webpack");
const path = require('path');

module.exports = {
    mode: 'development',

    entry: {
        head: './SPA/head.ts',
        main: './SPA/main.ts',
        pool: './SPA/pool.ts',
        "pool-account": './SPA/pool-account.ts',
        "live-dashboard": './SPA/live-dashboard.ts'
    },

    output: {
        path: path.resolve(__dirname, "wwwroot/build"),
        publicPath: 'auto'
    },

    performance: {
        hints: false
    },

    // Config for minimal console.log mess
    stats: {
        assets: false,
        colors: true,
        version: true,
        hash: false,
        timings: false,
        chunks: true,
        chunkModules: false
    },

    devtool: 'source-map',

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
                    'style-loader',
                    'css-loader',
                    'postcss-loader',
                    'sass-loader'
                ]
            },

            // SetupAssistants Templates
            { include: [path.resolve(__dirname, "SPA/Components/SetupAssistants/Templates")],  type: 'asset/source' },

            {test: /\.(png|jpg|svg)$/, type: 'asset/resource'},
            {test: /\.md/, use: 'markdown-it'}
        ],
    },

    plugins: [
        new webpack.IgnorePlugin({resourceRegExp: /^(\.\/locale\/|moment\/)$/}),

        new webpack.DefinePlugin({
            PRODUCTION: false
        })
    ],

    devServer: {
        historyApiFallback: false,
        hot: false,
        headers: {"X-Custom-Header": "yes"},

        static: {
            directory: path.resolve(__dirname, "./wwwroot/build/"),
        },

        devMiddleware: {
            publicPath: "/build/",

            stats: {
                assets: false,
                colors: true,
                version: true,
                hash: false,
                timings: false,
                chunks: true,
                chunkModules: false
            },
        }
    }
}
