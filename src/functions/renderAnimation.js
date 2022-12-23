
//NOTE: 성능 최적화 개판입니다.

const renderAnimation = {
    state: {
        animateElements: {},
        elements: undefined,
        options: undefined,
        numberOfRenderingRequired: 0,
        renderingCount: 0
    },

    initAnimateElementState: function (elementId) {
        let canvas = document.createElement("canvas")
        canvas.classList.add("d-none")
        canvas.setAttribute('width', "1920")
        canvas.setAttribute('height', "1080")

        let context = canvas.getContext("2d");

        renderAnimation.state.animateElements[elementId] = {
            renderFrameLength: 0,
            savedFrameCount: 0,
            isCombineFrames: false,
            canvas: canvas,
            context: context
        }
    },

    render: function (elements, options) {
        console.log(elements)
        renderAnimation.elements = elements
        renderAnimation.options = options

        let path = `${options.videoDestinationFolder}/temp`

        // let canvas = document.createElement("canvas")
        // canvas.classList.add("d-none")
        // canvas.setAttribute('width', "1920")
        // canvas.setAttribute('height', "1080")

        // let context = canvas.getContext("2d");

        fs.mkdir(path, { recursive: true }, (err) => {
            if (err) {
                return 0
            }

            fse.emptyDirSync(path);


            for (const elementId in elements) {
                if (Object.hasOwnProperty.call(elements, elementId)) {
                    const element = elements[elementId];    
    
                    if (element.filetype == 'image' && element.animation.isActivate == true) {
                        renderAnimation.initAnimateElementState(elementId)
                        renderAnimation.state.numberOfRenderingRequired += 1

                        let frames = renderAnimation.renderFrame({
                            elementId: elementId,
                            elements: element
                        })
    
                        for (let index = 0; index < frames.length; index++) {
    
                            renderAnimation.saveFrame({
                                elementId: elementId,
                                data: frames[index],
                                outputDir: path,
                                frame: index
                            })
                        }                        
                    }
                }
            }
        })


    },

    renderFrame: function ({ elementId, elements }) {
        let canvas = renderAnimation.state.animateElements[elementId].canvas
        let context = renderAnimation.state.animateElements[elementId].context

        let allPoints = elements.animation.allpoints
        let canvasImage = []
        renderAnimation.state.animateElements[elementId].renderFrameLength = allPoints.length
    
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
                renderAnimation.state.animateElements[elementId].savedFrameCount += 1

                if (renderAnimation.state.animateElements[elementId].savedFrameCount >= renderAnimation.state.animateElements[elementId].renderFrameLength && 
                    renderAnimation.state.animateElements[elementId].isCombineFrames == false) {

                    renderAnimation.state.animateElements[elementId].isCombineFrames == true
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
        let outputVideoPath = `${outputDir}/${elementId}.webm`

        //NOTE: 다중 애니메이션 랜더링까진 ok, 근데 투명도가 적용이 안됨

        command.input(`${outputDir}/frame-${elementId}-%04d.png`)
        command.inputFPS(50);
        command.videoCodec('libvpx-vp9')
        command.inputOptions('-pix_fmt yuva420p');
        command.format('webm')
        command.output(outputVideoPath)
        command.on('end', function() {
            renderAnimation.elements[elementId].filetype = 'video'
            renderAnimation.elements[elementId].isExistAudio = false
            renderAnimation.elements[elementId].localpath = outputVideoPath
            renderAnimation.elements[elementId].trim = { startTime: 0, endTime: renderAnimation.elements[elementId].duration }
            renderAnimation.elements[elementId].height = 1080
            renderAnimation.elements[elementId].width = 1920
            renderAnimation.elements[elementId].location = {x: 0, y: 50}
            renderAnimation.elements[elementId].codec = { video: "libvpx-vp9", audio: "default" }

            
            renderAnimation.state.renderingCount += 1

            if (renderAnimation.state.renderingCount >= renderAnimation.state.numberOfRenderingRequired) {
                renderAnimation.renderOutput()
            }

            console.log('Finished processing');
        })
        command.run();

    },

    renderOutput: function () {
        ipcRenderer.send('RENDER', renderAnimation.elements, renderAnimation.options)

    },

    

}

export default renderAnimation