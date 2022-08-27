const path = require('path');

module.exports = {
    "entry":["./app/src/index.js"],
    "watch": true,
    "output": {
        "filename": "index.js",
        "path": path.resolve(__dirname, 'app/dist'),
        "library": "nugget"
    }
}