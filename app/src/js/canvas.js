



const canvasPreview = {
    mediaRecorder: undefined,
    resize: function () {
        let width = window.innerWidth*0.65;
        let height = (width*9)/16

        preview.width = width
        preview.height = height
        preview.style.width = `${width}px`
        preview.style.height = `${height}px`
        video.style.width = `${width}px`
        video.style.height = `${height}px`

        nugget.element.preview.previewRatio = 1920/width

    },
    render: function (self) {
        let ctx = self.getContext('2d');
        let key;
        preview.clear();

        for(key in nugget.element.timeline) {
            let blob = `blob:${location.origin}/${key}`
            

            if (nugget.element.timeline[key].startTime > nugget.element.player.progress || nugget.element.timeline[key].startTime + nugget.element.timeline[key].duration < nugget.element.player.progress) {
                
            } else {
                let img = new Image();
                img.src = blob;
                ctx.drawImage(
                    img, 
                    nugget.element.timeline[key].location.x, 
                    nugget.element.timeline[key].location.y, 
                    nugget.element.timeline[key].width,
                    nugget.element.timeline[key].height
                )

                
            }
        }

        let splitInnerBottom = document.getElementById("split_inner_bottom")
        let endOfScroll = splitInnerBottom.scrollWidth - splitInnerBottom.offsetWidth
        if (endOfScroll <= nugget.element.player.progress+1 && canvasPreview.mediaRecorder != undefined) {
            canvasPreview.mediaRecorder.stop()
        }


    },
    clear: function (self) {
        preview.width = preview.width
    },
    export: function () {
        let chunks = [];
        let time = 0;


        return new Promise(function (res, rej) {
            let stream = preview.captureStream(60);

            canvasPreview.mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm; codecs=vp9"
            });

            canvasPreview.mediaRecorder.start(time);

            canvasPreview.mediaRecorder.ondataavailable = function (e) {
                chunks.push(event.data);
            }

            canvasPreview.mediaRecorder.onstop = function (event) {
                let blobVideo = new Blob(chunks, {
                    "type": "video/webm"
                });

                let url = URL.createObjectURL(blobVideo);
                res({url, blobVideo});

                exportVideo.src = url;
                exportVideoModal.show()
                
            }

            nugget.element.player.start()
            canvasPreview.render()

        
        });
        
    }

}

const canvas = {
    preview: canvasPreview
}

export default canvas