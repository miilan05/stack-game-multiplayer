const path = require("path");

module.exports = {
    entry: "./src/script.js",

    devServer: {
        port: 8080,
        static: "./server/public",
        hot: true
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "server/public/routes/game")
    },
    module: {
        rules: [{ test: /\.css$/, use: ["style-loader", "css-loader"] }]
    },
    mode: "development"
};
