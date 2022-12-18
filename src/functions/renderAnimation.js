

const renderAnimation = {

    render: function (elements, options) {
        console.log(elements)

        let canvas = document.createElement("canvas")
        canvas.classList.add("d-none")
        canvas.setAttribute('width', "1920")
        canvas.setAttribute('height', "1080")

        let context = canvas.getContext("2d");


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

                        //NOTE: outputDir 폴더 생성 필요
                        renderAnimation.saveFrame({
                            data: frames[index],
                            outputDir: "/Users/hhj/Desktop/NT",
                            frame: index
                        })
                    }



                    console.log(frames)
                    
                }
                
            }
        }


    },

    renderFrame: function ({ elementId, elements, context, canvas }) {
        
        let allPoints = elements.animation.allpoints
        let canvasImage = []
        console.log(allPoints)
    
        for (let index = 0; index < 10; index++) {
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
    

    saveFrame: function ({ data, outputDir, frame }) {
        const frameLength = 30
        const base64Data = data.substring("data:image/png;base64,".length);
        const fileName = path.join(
          outputDir,
          `frame-${String(frame + 1).padStart(frameLength, "0")}.png`
        );

        fs.writeFile(fileName, base64Data, "base64", (err) => {
            if (err)
              console.log(err);
            else {
              console.log("File written successfully\n");
            }
        });
    },

}

export default renderAnimation