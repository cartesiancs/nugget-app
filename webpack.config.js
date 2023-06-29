const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');


module.exports = {
    "entry":["./src/index.js"],
    "watch": false,
    "plugins": [
        new MiniCssExtractPlugin({ filename: `style.css` })
    ],
    "module": {
        "rules": [
            {
                "test": /\.jsx?/,
                "loader": 'babel-loader',
                "options": {
                    "presets": ['@babel/preset-env', '@babel/preset-react']
                }
            },
            {
                "test": /\.s[ac]ss$/i,
                "use": [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            }
        ],
    },
    "output": {
        "filename": "index.js",
        "path": path.resolve(__dirname, 'app/dist'),
        "library": "NUGGET"
    }
}