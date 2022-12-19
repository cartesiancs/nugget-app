

const renderAnimation = {
    renderFrameLength: 0,
    savedFrameCount: 0,
    elements: undefined,
    options: undefined,

    render: function (elements, options) {
        console.log(elements)
        renderAnimation.elements = elements
        renderAnimation.options = options

        let path = `${options.videoDestinationFolder}/a`

        let canvas = document.createElement("canvas")
        canvas.classList.add("d-none")
        canvas.setAttribute('width', "1920")
        canvas.setAttribute('height', "1080")

        let context = canvas.getContext("2d");

        fs.mkdir(path, { recursive: true }, (err) => {
            if (err) {
                return 0
            }

            for (const elementId in elements) {
                if (Object.hasOwnProperty.call(elements, elementId)) {
                    const element = elements[elementId];
                    console.log(element)
    
    
                    if (element.filetype == 'image' && element.animation.isActivate == true) {
                        console.log(element)
                        let frames = renderAnimation.renderFrame({
                            elementId: elementId,
                            elements: element, 
                            context: context, 
                            canvas: canvas
                        })
    
                        for (let index = 0; index < frames.length; index++) {
    
                            renderAnimation.saveFrame({
                                elementId: elementId,
                                data: frames[index],
                                outputDir: path,
                                frame: index
                            })
                        }
                        console.log(frames)
                        
                    }
                }
            }
        })


    },

    renderFrame: function ({ elementId, elements, context, canvas }) {
        
        let allPoints = elements.animation.allpoints
        let canvasImage = []
        renderAnimation.renderFrameLength = allPoints.length
    
        for (let index = 0; index < allPoints.length; index++) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            renderAnimation.drawImage(elementId, context, allPoints[index])
            context.stroke();
            canvasImage.push(canvas.toDataURL("image/png"))        
        }   
        
        return canvasImage
    },

    drawImage: function (elementId, context, point) {
        let elementBody = document.querySelector(`element-control-asset[element-id='${elementId}']`).querySelector("img")

        context.drawImage(elementBody, 0 + point.y, 0);
    },
    

    saveFrame: function ({ data, outputDir, frame, elementId }) {
        const frameLength = 4
        const base64Data = data.substring("data:image/png;base64,".length);
        const fileName = path.join(
          outputDir,
          `frame-${elementId}-${String(frame + 1).padStart(frameLength, "0")}.png`
        );

        fs.writeFile(fileName, base64Data, "base64", (err) => {
            if (err)
              console.log(err);
            else {
                renderAnimation.savedFrameCount += 1
                if (renderAnimation.savedFrameCount >= renderAnimation.renderFrameLength) {
                    renderAnimation.combineFrame({
                        elementId: elementId,
                        outputDir: outputDir
                    })
                }
              console.log("File written successfully\n");
            }
        });
    },


    combineFrame: function ({ elementId, outputDir }) {
        let command = ffmpeg()
        let outputVideoPath = `${outputDir}/${elementId}.mp4`

        command.input(`${outputDir}/frame-${elementId}-%04d.png`)
        command.inputFPS(50);

        command.output(outputVideoPath)
        command.on('end', function() {
            renderAnimation.elements[elementId].filetype = 'video'
            renderAnimation.elements[elementId].isExistAudio = false
            renderAnimation.elements[elementId].localpath = outputVideoPath
            renderAnimation.elements[elementId].duration = 2000,
            renderAnimation.elements[elementId].trim = { startTime: 0, endTime: renderAnimation.elements[elementId].duration }
            renderAnimation.elements[elementId].height = 1080
            renderAnimation.elements[elementId].width = 1920
            renderAnimation.elements[elementId].location = {x: 0, y: 0},

            renderAnimation.renderOutput()

            console.log('Finished processing');
        })
        command.run();

    },

    renderOutput: function () {
        ipcRenderer.send('RENDER', renderAnimation.elements, renderAnimation.options)

    },

    

}

export default renderAnimation