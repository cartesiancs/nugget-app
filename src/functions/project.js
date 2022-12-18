


const project = {
    save: function() {
        const zip = new JSZip();
  

        const elementTimeline = document.querySelector('element-timeline')
        const timeline = document.querySelector('element-timeline').timeline
        const projectDuration = Number(document.querySelector("#projectDuration").value)
        const projectFolder = document.querySelector("#projectFolder").value
        const projectRatio = elementControlComponent.previewRatio

        ipcRenderer.invoke('dialog:saveProject').then((result) => {
            let projectDestination = result || `nonefile`
            if (projectDestination == `nonefile`) {
                return 0
            }

            console.log(projectDestination)


            const options = {
                videoDuration: projectDuration,
                previewRatio: projectRatio,
                videoDestination: projectDestination
            }
    
            zip.file("timeline.json", JSON.stringify(timeline));
            zip.file("renderOptions.json", JSON.stringify(options));
    
            zip.generateAsync({type:"blob"}).then(async function(content) {
                const buffer = Buffer.from( await content.arrayBuffer() );
    
                fs.writeFile( projectDestination , buffer, () => {
                    console.log('saved!')
                    elementTimeline.appendCheckpointInHashTable()
                });
                //saveAs(content, `${projectFolder}/aaa.zip`);
            });
        })

        // if (fs.existsSync(`${projectFolder}/project.ngt`)) {
        //     fs.unlinkSync(`${projectFolder}/project.ngt`)
        // }


    },

    load: function() {
        const zip = new JSZip();
        const elementTimeline = document.querySelector('element-timeline')


        const upload = document.createElement("input")
        upload.setAttribute("type", 'file')
        upload.setAttribute("accept", '.ngt')

        upload.click()

        upload.addEventListener("change", handleFiles, false);

        function handleFiles() {
            elementTimeline.resetTimelineData()

            let filepath = this.files[0].path
            fs.readFile(filepath, function(err, data) {
                if (err) throw err;
                JSZip.loadAsync(data).then(function (zip) {
                    let aa = zip.file("timeline.json").async("string").then(async (result) => {
                        let timeline = JSON.parse(result)
                        console.log(timeline['0f5195f2-4ffb-4a41-9a6a-069db9eefd11'])
                        await elementTimeline.patchTimeline(timeline)

                    })
                });
            });

        }
    },

}

export default project