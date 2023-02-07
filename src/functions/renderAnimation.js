
//NOTE: 성능 최적화 개판입니다.

const renderProgress = {
    show: function (prog) {
        rendererUtil.showProgressModal()
        document.querySelector("#progress").style.width = `${prog}%`
        document.querySelector("#progress").innerHTML = `${Math.round(prog)}%`
    }
}

const renderAnimation = {
    state: {
        animateElements: {},
        elements: undefined,
        options: undefined,
        numberOfRenderingRequired: 0,
        renderingCount: 0,
        renderingProgress: 0

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
        renderAnimation.state.elements = elements
        renderAnimation.state.options = options
        renderAnimation.state.numberOfRenderingRequired = 0

        let path = `${options.videoDestinationFolder}/renderAnimation`

        // let canvas = document.createElement("canvas")
        // canvas.classList.add("d-none")
        // canvas.setAttribute('width', "1920")
        // canvas.setAttribute('height', "1080")

        // let context = canvas.getContext("2d");


        window.electronAPI.req.filesystem.mkdir(path, { recursive: true }).then((isCompleted) => {
            renderProgress.show(0)


            window.electronAPI.req.filesystem.emptyDirSync(path)


            for (const elementId in elements) {
                if (Object.hasOwnProperty.call(elements, elementId)) {
                    const element = elements[elementId];  
                    
                    if (element.hasOwnProperty("animation") == false) {
                        continue;
                    }

                    if (element.filetype !== 'image') {
                        continue;
                    }
    
                    if (element.animation["position"].isActivate == true) {
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

            if (renderAnimation.state.numberOfRenderingRequired == 0) {
                renderAnimation.renderOutput()
            }
        })




    },

    renderFrame: function ({ elementId, elements }) {
        let canvas = renderAnimation.state.animateElements[elementId].canvas
        let context = renderAnimation.state.animateElements[elementId].context

        let allPoints = elements.animation["position"].allpoints
        let canvasImage = []
        renderAnimation.state.animateElements[elementId].renderFrameLength = allPoints[0].length
    
        for (let index = 0; index < allPoints[0].length; index++) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            let point = {
                x: allPoints[0][index].y,
                y: index < allPoints[1].length ? allPoints[1][index].y : allPoints[1][allPoints[1].length - 1].y
            }
            renderAnimation.drawImage(elementId, context, point)
            context.stroke();
            canvasImage.push(canvas.toDataURL("image/png"))        
        }   
        
        return canvasImage
    },

    drawImage: function (elementId, context, point) {
        let elementBody = document.querySelector(`element-control-asset[element-id='${elementId}']`).querySelector("img")

        let x = 0 + point.x
        let y = point.y
        let w = renderAnimation.state.elements[elementId].width
        let h = renderAnimation.state.elements[elementId].height

        context.drawImage(elementBody, x, y, w, h);
    },
    

    saveFrame: function ({ data, outputDir, frame, elementId }) {
        const frameLength = 4
        const base64Data = data.substring("data:image/png;base64,".length);
        const fileName = `${outputDir}/` + `frame-${elementId}-${String(frame + 1).padStart(frameLength, "0")}.png`


        
        window.electronAPI.req.filesystem.writeFile(fileName, base64Data, "base64").then((isCompleted) => {
            renderAnimation.state.animateElements[elementId].savedFrameCount += 1

            if (renderAnimation.state.animateElements[elementId].savedFrameCount >= renderAnimation.state.animateElements[elementId].renderFrameLength && 
                renderAnimation.state.animateElements[elementId].isCombineFrames == false) {

                renderAnimation.state.animateElements[elementId].isCombineFrames == true
                renderAnimation.combineFrame({
                    elementId: elementId,
                    outputDir: outputDir
                })
            }
        })

    },


    combineFrame: function ({ elementId, outputDir }) {
        let outputVideoPath = `${outputDir}/${elementId}.webm`

        window.electronAPI.req.ffmpeg.combineFrame(outputDir, elementId)

        window.electronAPI.res.render.finishCombineFrame( (evt, combinedElementId) => {
            if (combinedElementId != elementId) {
                return 0
            }

            renderAnimation.state.elements[elementId].filetype = 'video'
            renderAnimation.state.elements[elementId].isExistAudio = false
            renderAnimation.state.elements[elementId].localpath = outputVideoPath
            renderAnimation.state.elements[elementId].trim = { startTime: 0, endTime: renderAnimation.state.elements[elementId].duration }
            renderAnimation.state.elements[elementId].height = 1080
            renderAnimation.state.elements[elementId].width = 1920
            renderAnimation.state.elements[elementId].location = {x: 0, y: 50}
            renderAnimation.state.elements[elementId].codec = { video: "libvpx-vp9", audio: "default" }

            
            renderAnimation.state.renderingCount += 1
            renderAnimation.state.renderingProgress = renderAnimation.state.renderingCount/renderAnimation.state.numberOfRenderingRequired*100

            renderProgress.show(renderAnimation.state.renderingProgress)
            

            if (renderAnimation.state.renderingCount >= renderAnimation.state.numberOfRenderingRequired) {
                renderAnimation.renderOutput()
            }
        })

        
        // let command = ffmpeg()
        // let outputVideoPath = `${outputDir}/${elementId}.webm`
        // console.log('Animation processing', renderAnimation.state.renderingCount, renderAnimation.state.numberOfRenderingRequired);

        


        //NOTE: 다중 애니메이션 랜더링까진 ok, 근데 투명도가 적용이 안됨

        // command.input(`${outputDir}/frame-${elementId}-%04d.png`)
        // command.inputFPS(50);
        // command.videoCodec('libvpx-vp9')
        // command.inputOptions('-pix_fmt yuva420p');
        // command.format('webm')
        // command.output(outputVideoPath)
        // command.on('end', function() {
        //     console.log('Finish processing');

        //     renderAnimation.state.elements[elementId].filetype = 'video'
        //     renderAnimation.state.elements[elementId].isExistAudio = false
        //     renderAnimation.state.elements[elementId].localpath = outputVideoPath
        //     renderAnimation.state.elements[elementId].trim = { startTime: 0, endTime: renderAnimation.state.elements[elementId].duration }
        //     renderAnimation.state.elements[elementId].height = 1080
        //     renderAnimation.state.elements[elementId].width = 1920
        //     renderAnimation.state.elements[elementId].location = {x: 0, y: 50}
        //     renderAnimation.state.elements[elementId].codec = { video: "libvpx-vp9", audio: "default" }

            
        //     renderAnimation.state.renderingCount += 1
        //     renderAnimation.state.renderingProgress = renderAnimation.state.renderingCount/renderAnimation.state.numberOfRenderingRequired*100

        //     renderProgress.show(renderAnimation.state.renderingProgress)
            

        //     if (renderAnimation.state.renderingCount >= renderAnimation.state.numberOfRenderingRequired) {
        //         renderAnimation.renderOutput()
        //     }

        //     console.log('Finished processing');
        // })

        // command.on('error', function(err, stdout, stderr) {
        //     console.log('Render Error', err.message);
        // });
        // command.run();

    },

    renderOutput: function () {
        console.log('REND processing');

        //ipcRenderer.send('RENDER', renderAnimation.state.elements, renderAnimation.state.options)

        window.electronAPI.req.render.outputVideo(renderAnimation.state.elements, renderAnimation.state.options)
        
    },

    

}

export default renderAnimation