const mime = {
    mimeArray: {
        "png": {
            type: "image"
        },
        "jpg": {
            type: "image"
        },
        "jpeg": {
            type: "image"
        },
        "gif": {
            type: "image"
        },
        "mp4": {
            type: "video"
        },
        "mov": {
            type: "video"
        },
        "avi": {
            type: "video"
        },
        "wmv": {
            type: "video"
        },
        "mpg": {
            type: "video"
        },
        "mkv": {
            type: "video"
        },
        "webm": {
            type: "video"
        },
        "mp3": {
            type: "audio"
        },
        "wav": {
            type: "audio"
        },
        "m4a": {
            type: "audio"
        },
    },
    lookup: function(filename) {
        const splitFilename = filename.split('.')
        if (splitFilename.length <= 1) {
            return { type: "unknown" }
        } else {
            if (!this.mimeArray[splitFilename[splitFilename.length-1]]) {
                return { type: "unknown" }
            } else {
                return { type: this.mimeArray[splitFilename[splitFilename.length-1]].type }
            }
            
        }

    }

}

export default mime