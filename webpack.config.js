const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
    "entry":["./app/src/index.js"],
    "watch": true,
    "plugins": [
        new MiniCssExtractPlugin({ filename: `style.css` })
    ],
    "module": {
        "rules": [{
            "test": /\.s[ac]ss$/i,
            "use": [
                MiniCssExtractPlugin.loader,
                "css-loader",
                "sass-loader",
            ],
        }],
    },
    "output": {
        "filename": "index.js",
        "path": path.resolve(__dirname, 'app/dist'),
        "library": "NUGGET"
    }
}