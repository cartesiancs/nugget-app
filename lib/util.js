

const fs = require('fs');


const util = {
    calculateEstimatedTime: (totalVideoTime) => {

    }
}


const fileSystem = {
    createDir: (path) => {
        fs.mkdir(path, { recursive: true }, (err) => {
            if (err) throw err;
        });
    }
}



exports.util = util
exports.fileSystem = fileSystem
