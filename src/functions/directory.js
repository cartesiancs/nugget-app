


const directory = {
    select: function() {
        const projectFolder = document.querySelector("#projectFolder")
        window.electronAPI.req.dialog.openDirectory().then((result) => {
            projectFolder.value = result || '/'
            const dir = String(projectFolder.value)

            window.electronAPI.req.filesystem.getDirectory(dir).then((result) => {
                let fileLists = {}
                const assetList = document.querySelector("asset-list")
                const assetBrowser = document.querySelector("asset-browser")
            
                assetList.nowDirectory = dir
                assetList.clearList()
                assetBrowser.updateDirectoryInput(dir)
                    
                for (const key in result) {
                    if (Object.hasOwnProperty.call(result, key)) {
                        const element = result[key];
                        if (!element.isDirectory) { 
                            fileLists[key] = element
                        } else {
                            assetList.getFolder(element.title)
                        }
                    }
                }
            
                for (const file in fileLists) {
                    if (Object.hasOwnProperty.call(fileLists, file)) {
                        const element = fileLists[file];
                        assetList.getFile(element.title)
                    }
                }
            })

            //window.electronAPI.req.filesystem.getAllDirectory(String(projectFolder.value))
            //ipc.requestAllDir(result || '/')
        })

        

        // const upload = document.createElement("input")
        // const projectFolder = document.querySelector("#projectFolder")
        // upload.setAttribute("type", 'file')
        // upload.setAttribute("webkitdirectory", '')
        // upload.click()

        // upload.addEventListener("change", handleFiles, false);

        // function handleFiles() {
        //     const dirWithFilename = this.files[0].path.split("/");
        //     dirWithFilename.pop()
        //     const originDir = dirWithFilename.join("/")
        //     projectFolder.value = originDir
        // }


    }

}

export default directory