


const directory = {
    select: function() {
        const upload = document.createElement("input")
        const projectFolder = document.querySelector("#projectFolder")
        upload.setAttribute("type", 'file')
        upload.setAttribute("webkitdirectory", '')
        upload.click()

        upload.addEventListener("change", handleFiles, false);

        function handleFiles() {
            const dirWithFilename = this.files[0].path.split("/");
            dirWithFilename.pop()
            const originDir = dirWithFilename.join("/")
            projectFolder.value = originDir
        }


    }

}

export default directory