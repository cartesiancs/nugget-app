const elementTimeline = {
    /*
    "aa-aa": {
        startTime: 5,
        duration: 1000,
        location: {x: 0, y: 0},
        width: 100,
        height: 100
    }
    */
}

const elementPlayer = {
    scroller: undefined,
    isPaused: true,
    progress: split_inner_bottom.scrollLeft,
    start: function () {
        let toggle = document.querySelector("#playToggle")
        toggle.setAttribute('onclick', `nugget.element.player.stop()`)
        toggle.innerHTML = `<i class="fas fa-pause text-light"></i>`

        elementPlayer.scroller = setInterval(function() {
            //split_inner_bottom.scrollBy(4, 0);
            let nowTimelineProgress = Number(timeline_bar.style.left.split('px')[0]) + 4
            timeline_bar.style.left = `${nowTimelineProgress}px`
            elementPlayer.progress = nowTimelineProgress
            if ((split_inner_bottom.innerWidth + split_inner_bottom.offsetWidth) >= split_inner_bottom.offsetWidth) {
                elementPlayer.stop();
            }
            elementPreview.play()
        }, 20);
        elementPlayer.isPaused = false;

    },
    stop: function () {
        clearInterval(elementPlayer.scroller);
        elementPlayer.isPaused = true;

        let toggle = document.querySelector("#playToggle")
        toggle.setAttribute('onclick', `nugget.element.player.start()`)
        toggle.innerHTML = `<i class="fas fa-play text-light"></i>`

        elementPreview.pauseAllVideo()
    },
    reset: function () {
        timeline_bar.style.left = `0px`
        elementPlayer.progress = 0
        elementPlayer.isPaused = true;

    }
}

const elementBar = {
    event: {
        drag: {
            onmousedown: function (e) {
                valueEvent.elementBar.blob = e.getAttribute('value')
                valueEvent.elementBar.isDrag = true
                valueEvent.elementBar.e = e
                valueEvent.elementBar.criteria.x = valueEvent.mouse.x - Number(valueEvent.elementBar.e.style.left.replace(/[^0-9]/g, ""))
                valueEvent.elementBar.criteria.y = valueEvent.mouse.y
            },
            onmouseup: function (e) {
                valueEvent.elementBar.isDrag = false

            }
        },
        resize: {
            rangeonmousedown: function (e, location = 'left') {
                valueEvent.elementBar.e = e.parentNode.parentNode
                valueEvent.elementBar.blob = valueEvent.elementBar.e.getAttribute('value')
                valueEvent.elementBar.isResize = true
                valueEvent.elementBar.resizeLocation = location
                valueEvent.elementBar.isDrag = false

                valueEvent.elementBar.criteria.duration = nugget.element.timeline[valueEvent.elementBar.blob.split('/')[3]].duration + Number(valueEvent.elementBar.e.style.left.replace(/[^0-9]/g, ""))

                valueEvent.elementBar.criteriaResize.x = Number(valueEvent.elementBar.e.style.left.replace(/[^0-9]/g, ""))
                
                valueEvent.elementBar.resizeRangeLeft = Number(valueEvent.elementBar.e.querySelector(".element-bar-hiddenspace-left").style.width.split('px')[0])
                valueEvent.elementBar.resizeRangeRight = Number(valueEvent.elementBar.e.querySelector(".element-bar-hiddenspace-right").style.width.split('px')[0])

            },
            onmousedown: function (e, location = 'left') {
                valueEvent.elementBar.blob = e.parentNode.getAttribute('value')
                valueEvent.elementBar.isResize = true
                valueEvent.elementBar.resizeLocation = location
                valueEvent.elementBar.isDrag = false
                valueEvent.elementBar.e = e.parentNode

                valueEvent.elementBar.criteriaResize.x = location == 'left' ? 
                    valueEvent.mouse.x - Number(valueEvent.elementBar.e.style.left.replace(/[^0-9]/g, "")) : 
                    Number(valueEvent.elementBar.e.style.left.replace(/[^0-9]/g, ""))
                valueEvent.elementBar.criteriaResize.y = valueEvent.mouse.y
                
                valueEvent.elementBar.criteria.duration = nugget.element.timeline[valueEvent.elementBar.blob.split('/')[3]].duration + Number(valueEvent.elementBar.e.style.left.replace(/[^0-9]/g, ""))

            },
            onmouseup: function (e) {
                valueEvent.elementBar.isResize = false
                //nugget.element.timeline[valueEvent.elementBar.blob.split('/')[3]].duration = Number(valueEvent.elementBar.e.style.width.split('px')[0])
            }
        }
    },
    append: function (blob) {
        let body = document.querySelector("#split_inner_bottom")
        let elementId = blob.split('/')[3]
        let width = elementTimeline[elementId].duration
        let filetype = elementTimeline[elementId].filetype

        let splitedFilepath = elementTimeline[elementId].localpath.split('/')
        let filepath = splitedFilepath[splitedFilepath.length-1]

        let insertDynamicElement;
        let insertStaticElement = `<div class="element-bar" style="width: ${width}px; left: 0px;" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${blob}">
            ${filepath}
            <div class="element-bar-resize-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'left')"></div>
            <div class="element-bar-resize-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'right')"></div>
            </div>`


        if (filetype == 'video') {
            insertDynamicElement = `<div class="element-bar" style="width: ${width}px; left: 0px;" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${blob}">
            ${filepath}
            <div class="element-bar-hiddenspace-left position-absolute">
                <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="nugget.element.bar.event.resize.rangeonmousedown(this, 'left')">
                </div>
            </div>
            <div class="element-bar-hiddenspace-right position-absolute">
                <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="nugget.element.bar.event.resize.rangeonmousedown(this, 'right')">
                </div>
            </div>
            </div>`
        }

        let insertElement = filetype != 'video' ? insertStaticElement : insertDynamicElement

        body.insertAdjacentHTML("beforeend", insertElement)
    },
    drag: function (x, y) {
        valueEvent.elementBar.e.style.left = `${x}px`
        let elementId = valueEvent.elementBar.blob.split('/')[3]
        nugget.element.timeline[elementId].startTime = x
    },
    resizeDurationInTimeline: function (x, location = 'left') {
        let elementId = valueEvent.elementBar.blob.split('/')[3]
        let duration = valueEvent.elementBar.criteria.duration 

        if (location == 'left') {
            valueEvent.elementBar.e.style.left = `${x}px`
            valueEvent.elementBar.e.style.width = `${duration-x}px`
            elementTimeline[elementId].startTime = x
            elementTimeline[elementId].duration = Number(valueEvent.elementBar.e.style.width.split('px')[0])
        } else {
            valueEvent.elementBar.e.style.left = `${valueEvent.elementBar.criteriaResize.x}px`
            valueEvent.elementBar.e.style.width = `${split_inner_bottom.scrollLeft+valueEvent.mouse.x-valueEvent.elementBar.criteriaResize.x}px`
            elementTimeline[elementId].startTime = valueEvent.elementBar.criteriaResize.x
            elementTimeline[elementId].duration = Number(valueEvent.elementBar.e.style.width.split('px')[0])
        }
    },
    resizeRangeOnElement: function (x, location = 'left') {
        let elementId = valueEvent.elementBar.blob.split('/')[3]
        let duration = valueEvent.elementBar.criteria.duration 
        let originResizeRangeLeft = valueEvent.elementBar.resizeRangeLeft
        let originResizeRangeRight = valueEvent.elementBar.resizeRangeRight

        let resizeRangeTargetLeft = valueEvent.elementBar.e.querySelector(".element-bar-hiddenspace-left")
        let resizeRangeTargetRight = valueEvent.elementBar.e.querySelector(".element-bar-hiddenspace-right")

        if (location == 'left') {
            resizeRangeTargetLeft.style.width = `${(x)-5}px`
            elementTimeline[elementId].trim.startTime = Number(resizeRangeTargetLeft.style.width.split('px')[0])


        } else {
            resizeRangeTargetRight.style.width = `${window.innerWidth-x-valueEvent.elementBar.criteriaResize.x}px`
            elementTimeline[elementId].trim.endTime = duration-Number(resizeRangeTargetRight.style.width.split('px')[0])

        }


    },
}

const elementControl = {
    state: {
        isResize: false,
        criteriaResize: {x: 0, y: 0, w: 0, h: 0},
        resizeDirection: '',
        resizeTargetElementId: ''
    },

    upload: {
        image: function (blob, path) {
            let img = document.createElement('img');
            let elementId = blob.split('/')[3]

            img.src = blob;
            img.onload = function() {
                let division = 10;
                var width = img.width/division;
                var height = img.height/division;

                nugget.element.timeline[elementId] = {
                    startTime: 0,
                    duration: 1000,
                    location: {x: 0, y: 0},
                    width: width,
                    height: height,
                    localpath: path,
                    filetype: 'image'

                }

                elementPreview.show.image(blob)
                elementBar.append(blob)

            }


        },

        video: function (blob, path) {
            let video = document.createElement('video');
            let elementId = blob.split('/')[3]

            video.src = blob
            video.preload = 'metadata';

            video.onloadedmetadata = function() {
                let division = 10;

                let width = video.videoWidth/division;
                let height = video.videoHeight/division;
                let duration = video.duration*200
    
                nugget.element.timeline[elementId] = {
                    startTime: 0,
                    duration: duration,
                    location: {x: 0, y: 0},
                    trim: {startTime: 0, endTime: 0},
                    width: width,
                    height: height,
                    localpath: path,
                    filetype: 'video'
                }
                
                elementPreview.show.video(blob)
                elementBar.append(blob)

            }
        }
    },
    drag: function (target, x, y) {
        let checkTagName = ['img', 'video']
        let existTagName = ''
        for (let tagname = 0; tagname < checkTagName.length; tagname++) {
            if (target.querySelector(checkTagName[tagname])) {
                existTagName = checkTagName[tagname]
            }
        }

        let elementId = target.querySelector(existTagName).getAttribute('src').split('/')[3]

        target.style.top = `${y}px`
        target.style.left = `${x}px`
        //target.style.transform = `translate(${x}px, ${y}px)`
        nugget.element.timeline[elementId].location.x = x 
        nugget.element.timeline[elementId].location.y = y
        preview.clear();
        //preview.render();
    },
    dragover: function (event) {
        event.stopPropagation();
        event.preventDefault();
    },
    drop: function (event) {
        event.stopPropagation();
        event.preventDefault();
    },
    onmouseup: function (event) {
        elementControl.state.isResize = false

        for (const elementId in elementTimeline) {
            if (Object.hasOwnProperty.call(elementTimeline, elementId)) {
                let parentBody = document.querySelector(`#element-${elementId}`)
                parentBody.setAttribute("draggable", 'true')                
            }
        }
    },
    resize: {
        init: function (elementId, direction = 'n') {
            let parentBody = document.querySelector(`#element-${elementId}`)
            parentBody.setAttribute("draggable", 'false')
            elementControl.state.criteriaResize.w = Number(parentBody.style.width.split('px')[0])
            elementControl.state.criteriaResize.h = Number(parentBody.style.height.split('px')[0])
            elementControl.state.criteriaResize.x = Number(parentBody.style.left.split('px')[0])
            elementControl.state.criteriaResize.y = Number(parentBody.style.top.split('px')[0])
    
            elementControl.state.isResize = true
            elementControl.state.resizeTargetElementId = elementId
            elementControl.state.resizeDirection = direction
    
        },
        action: function (x, y) {
            let elementId = elementControl.state.resizeTargetElementId
            let targetBody = document.querySelector(`#element-${elementId}`)

            switch (elementControl.state.resizeDirection) {
                case 'n':
                    targetBody.style.top = `${elementControl.state.criteriaResize.y+y}px`
                    targetBody.style.height = `${elementControl.state.criteriaResize.h-y}px`

                    break;

                case 's':
                    targetBody.style.top = `${elementControl.state.criteriaResize.y}px`
                    targetBody.style.height = `${y}px`

                    break;

                case 'w':
                    targetBody.style.left = `${elementControl.state.criteriaResize.x+x}px`
                    targetBody.style.width = `${elementControl.state.criteriaResize.w-x}px`

                    break;

                case 'e':

                    targetBody.style.left = `${elementControl.state.criteriaResize.x}px`
                    targetBody.style.width = `${x}px`

                    break;
            
                default:
                    break;
            }

            nugget.element.timeline[elementId].location.y = Number(targetBody.style.top.split('px')[0])
            nugget.element.timeline[elementId].location.x = Number(targetBody.style.left.split('px')[0])
            nugget.element.timeline[elementId].width = Number(targetBody.style.width.split('px')[0])
            nugget.element.timeline[elementId].height = Number(targetBody.style.height.split('px')[0])
        }
    }

}

const elementPreview = {
    previewRatio: 1920/preview.width, // 1920x1080을 기준으로
    show: {
        image: function (blob) {
            let elementId = blob.split('/')[3]
            if (document.getElementById(`element-${elementId}`) == null) {
                control.insertAdjacentHTML("beforeend", `
                <div id="element-${elementId}" class="element-drag" style='width: ${nugget.element.timeline[elementId].width}px; height: ${nugget.element.timeline[elementId].height}px; top: 0px; left: 0px;' draggable="true">
                <img src="${blob}" alt="" class="element-image" draggable="false">
                <div class="resize-n" onmousedown="nugget.element.control.resize.init('${elementId}', 'n')"></div>
                <div class="resize-s" onmousedown="nugget.element.control.resize.init('${elementId}', 's')"></div>
                <div class="resize-w" onmousedown="nugget.element.control.resize.init('${elementId}', 'w')"></div>
                <div class="resize-e" onmousedown="nugget.element.control.resize.init('${elementId}', 'e')"></div>
    
                </div>
                `)
            } else {
                document.querySelector(`#element-${elementId}`).classList.remove('d-none')
            }
    
        },
        video: function (blob) {
            let elementId = blob.split('/')[3]
            if (document.getElementById(`element-${elementId}`) == null) {
                control.insertAdjacentHTML("beforeend", `
                <div id="element-${elementId}" class="element-drag" style='width: ${nugget.element.timeline[elementId].width}px; height: ${nugget.element.timeline[elementId].height}px; top: 0px; left: 0px;' draggable="true">
                <video src="${blob}" alt="" class="element-video" draggable="false"></video>
                <div class="resize-n" onmousedown="nugget.element.control.resize.init('${elementId}', 'n')"></div>
                <div class="resize-s" onmousedown="nugget.element.control.resize.init('${elementId}', 's')"></div>
                <div class="resize-w" onmousedown="nugget.element.control.resize.init('${elementId}', 'w')"></div>
                <div class="resize-e" onmousedown="nugget.element.control.resize.init('${elementId}', 'e')"></div>
    
                </div>
                `)
                let video = document.getElementById(`element-${elementId}`).querySelector("video");
                
                let secondsOfRelativeTime = (elementTimeline[elementId].startTime - elementPlayer.progress) / 200

                console.log(secondsOfRelativeTime)
                video.currentTime = secondsOfRelativeTime;

            } else {
                let video = document.getElementById(`element-${elementId}`).querySelector("video");
                let secondsOfRelativeTime = -(elementTimeline[elementId].startTime - elementPlayer.progress) / 200

                if (!!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)) {
                    if (elementPlayer.isPaused) {
                        console.log('paused')

                    }
                    console.log('isPlaying')
                } else {
                    video.currentTime = secondsOfRelativeTime;
                    video.play()
                }

                document.querySelector(`#element-${elementId}`).classList.remove('d-none')
            }
    
        },
    },

    hide: function (blob) {
        let elementId = blob.split('/')[3]

        if (elementTimeline[elementId].filetype == 'video') {
            elementPreview.pauseVideo(elementId)
        }
        document.querySelector(`#element-${elementId}`).classList.add('d-none')
    },
    play: function () {
        let key;
        //preview.render();

        for(key in nugget.element.timeline) {
            let blob = `blob:${location.origin}/${key}`
            let filetype = nugget.element.timeline[key].filetype
            let condition = nugget.element.timeline[key].startTime > elementPlayer.progress || 
                nugget.element.timeline[key].startTime + nugget.element.timeline[key].duration < elementPlayer.progress

            if (filetype == 'video') {
                condition = elementTimeline[key].startTime + elementTimeline[key].trim.startTime > elementPlayer.progress || 
                elementTimeline[key].startTime + elementTimeline[key].trim.endTime < elementPlayer.progress
            }

            if (condition) {
                elementPreview.hide(blob)
            } else {
                elementPreview.show[filetype](blob)
            }
        }
    },
    pauseVideo: function (elementId) {
        let video = document.getElementById(`element-${elementId}`).querySelector("video");
        video.pause()
    },
    pauseAllVideo: function () {
        let key;

        for(key in elementTimeline) {
            let filetype = elementTimeline[key].filetype

            if (filetype == 'video') {
                let video = document.getElementById(`element-${key}`).querySelector("video");
                video.pause()
            }
        }
    },
}


const element = {
    timeline: elementTimeline,
    player: elementPlayer,
    bar: elementBar,
    control: elementControl,
    preview: elementPreview
}

export default element