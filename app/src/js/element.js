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
    state: {
        isDrag: false,
        isResize: false,
        resizeLocation: 'left',
        resizeRangeLeft: 0,
        resizeRangeRight: 0,
        e: undefined,
        blob: '',
        criteria: {x: 0, y: 0, duration: 1000},
        criteriaResize: {x: 0, y: 0}
    },

    event: {
        drag: {
            onmousedown: function (e) {
                elementBar.state.blob = e.getAttribute('value')
                elementBar.state.isDrag = true
                elementBar.state.e = e
                elementBar.state.criteria.x = valueEvent.mouse.x - Number(elementBar.state.e.style.left.replace(/[^0-9]/g, ""))
                elementBar.state.criteria.y = valueEvent.mouse.y
            },
            onmouseup: function (e) {
                elementBar.state.isDrag = false

            }
        },
        resize: {
            onmousedownrange: function (e, location = 'left') {
                elementBar.state.e = e.parentNode.parentNode
                elementBar.state.blob = elementBar.state.e.getAttribute('value')
                elementBar.state.isResize = true
                elementBar.state.resizeLocation = location
                elementBar.state.isDrag = false
                elementBar.state.criteria.duration = elementTimeline[elementBar.state.blob.split('/')[3]].duration + Number(elementBar.state.e.style.left.replace(/[^0-9]/g, ""))
                elementBar.state.criteriaResize.x = Number(elementBar.state.e.style.left.replace(/[^0-9]/g, ""))
                
                elementBar.state.resizeRangeLeft = Number(elementBar.state.e.querySelector(".element-bar-hiddenspace-left").style.width.split('px')[0])
                elementBar.state.resizeRangeRight = Number(elementBar.state.e.querySelector(".element-bar-hiddenspace-right").style.width.split('px')[0])
            },
            onmousedown: function (e, location = 'left') {
                elementBar.state.blob = e.parentNode.getAttribute('value')
                elementBar.state.isResize = true
                elementBar.state.resizeLocation = location
                elementBar.state.isDrag = false
                elementBar.state.e = e.parentNode

                elementBar.state.criteriaResize.x = location == 'left' ? 
                    valueEvent.mouse.x - Number(elementBar.state.e.style.left.replace(/[^0-9]/g, "")) : 
                    Number(elementBar.state.e.style.left.replace(/[^0-9]/g, ""))
                elementBar.state.criteriaResize.y = valueEvent.mouse.y
                
                elementBar.state.criteria.duration = elementTimeline[elementBar.state.blob.split('/')[3]].duration + Number(elementBar.state.e.style.left.replace(/[^0-9]/g, ""))

            },
            onmouseup: function (e) {
                elementBar.state.isResize = false
                //elementTimeline[elementBar.state.blob.split('/')[3]].duration = Number(elementBar.state.e.style.width.split('px')[0])
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

        let elementBarBackgroundColor = elementBar.getRandomColor()

        let insertDynamicElement;
        let insertStaticElement = `<div class="element-bar" style="width: ${width}px; left: 0px; background-color: ${elementBarBackgroundColor};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${blob}">
            ${filepath}
            <div class="element-bar-resize-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'left')"></div>
            <div class="element-bar-resize-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'right')"></div>
            </div>`


        if (filetype == 'video') {
            insertDynamicElement = `<div class="element-bar" style="width: ${width}px; left: 0px; background-color: ${elementBarBackgroundColor};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${blob}">
            ${filepath}
            <div class="element-bar-hiddenspace-left position-absolute">
                <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'left')">
                </div>
            </div>
            <div class="element-bar-hiddenspace-right position-absolute">
                <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'right')">
                </div>
            </div>
            </div>`
        }

        let insertElement = filetype != 'video' ? insertStaticElement : insertDynamicElement

        body.insertAdjacentHTML("beforeend", insertElement)
    },
    drag: function (x, y) {
        let elementId = elementBar.state.blob.split('/')[3]
        elementBar.state.e.style.left = `${x}px`
        elementTimeline[elementId].startTime = x
    },
    resizeDurationInTimeline: function (x, location = 'left') {
        let elementId = elementBar.state.blob.split('/')[3]
        let duration = elementBar.state.criteria.duration 

        if (location == 'left') {
            elementBar.state.e.style.left = `${x}px`
            elementBar.state.e.style.width = `${duration-x}px`
            elementTimeline[elementId].startTime = x
            elementTimeline[elementId].duration = Number(elementBar.state.e.style.width.split('px')[0])
        } else {
            elementBar.state.e.style.left = `${elementBar.state.criteriaResize.x}px`
            elementBar.state.e.style.width = `${split_inner_bottom.scrollLeft+valueEvent.mouse.x-elementBar.state.criteriaResize.x}px`
            elementTimeline[elementId].startTime = elementBar.state.criteriaResize.x
            elementTimeline[elementId].duration = Number(elementBar.state.e.style.width.split('px')[0])
        }
    },
    resizeRangeOnElement: function (x, location = 'left') {
        let elementId = elementBar.state.blob.split('/')[3]
        let duration = elementBar.state.criteria.duration 
        let originResizeRangeLeft = elementBar.state.resizeRangeLeft
        let originResizeRangeRight = elementBar.state.resizeRangeRight

        let resizeRangeTargetLeft = elementBar.state.e.querySelector(".element-bar-hiddenspace-left")
        let resizeRangeTargetRight = elementBar.state.e.querySelector(".element-bar-hiddenspace-right")

        if (location == 'left') {
            resizeRangeTargetLeft.style.width = `${(x+split_inner_bottom.scrollLeft)-5}px`
            elementTimeline[elementId].trim.startTime = Number(resizeRangeTargetLeft.style.width.split('px')[0])
        } else {
            resizeRangeTargetRight.style.width = `${window.innerWidth-x-elementBar.state.criteriaResize.x}px`
            elementTimeline[elementId].trim.endTime = duration-Number(resizeRangeTargetRight.style.width.split('px')[0])
        }
    },
    getRandomColor: function () {
        let color = "#" + Math.round(Math.random() * 0xffffff).toString(16) + '51'
        return color
    }
}

const elementControl = {
    state: {
        isDrag: false,
        isResize: false,
        e: undefined,
        criteriaDrag: {x: 0, y: 0},
        criteriaResize: {x: 0, y: 0, w: 0, h: 0},
        resizeDirection: '',
        resizeTargetElementId: ''
    },

    event: {
        drag: {
            onmousedown: function (e) {
                elementControl.state.isDrag = true
                elementControl.state.e = e
                elementControl.state.criteriaDrag.x = valueEvent.mouse.x - Number(elementControl.state.e.style.left.replace(/[^0-9]/g, ""))
                elementControl.state.criteriaDrag.y = valueEvent.mouse.y - Number(elementControl.state.e.style.top.replace(/[^0-9]/g, ""))

            },
            onmouseup: function (e) {
                elementControl.state.isDrag = false
            }
        }
    },

    upload: {
        image: function (blob, path) {
            let img = document.createElement('img');
            let elementId = blob.split('/')[3]

            img.src = blob
            img.onload = function() {
                let division = 10
                var width = img.width/division
                var height = img.height/division

                elementTimeline[elementId] = {
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
            let video = document.createElement('video')
            let elementId = blob.split('/')[3]

            video.src = blob
            video.preload = 'metadata'

            video.onloadedmetadata = function() {
                let division = 10

                let width = video.videoWidth/division
                let height = video.videoHeight/division
                let duration = video.duration*200
    
                elementTimeline[elementId] = {
                    startTime: 0,
                    duration: duration,
                    location: {x: 0, y: 0},
                    trim: {startTime: 0, endTime: duration},
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
    drag: function (x, y) {
        let target = elementControl.state.e
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
        elementTimeline[elementId].location.x = x 
        elementTimeline[elementId].location.y = y

    },
    dragover: function (event) {
        event.stopPropagation()
        event.preventDefault()
    },
    drop: function (event) {
        event.stopPropagation()
        event.preventDefault()
    },
    onmouseup: function (event) {
        elementControl.state.isResize = false
        elementControl.state.isDrag = false
        console.log("A")

        for (const elementId in elementTimeline) {
            if (Object.hasOwnProperty.call(elementTimeline, elementId)) {
                let parentBody = document.querySelector(`#element-${elementId}`)
                // parentBody.setAttribute("draggable", 'true')                
            }
        }
    },
    resize: {
        init: function (elementId, direction = 'n') {
            let parentBody = document.querySelector(`#element-${elementId}`)
            //parentBody.setAttribute("draggable", 'false')
            elementControl.state.isDrag = false
            elementControl.state.criteriaResize.w = Number(parentBody.style.width.split('px')[0])
            elementControl.state.criteriaResize.h = Number(parentBody.style.height.split('px')[0])
            elementControl.state.criteriaResize.x = Number(parentBody.style.left.split('px')[0])
            elementControl.state.criteriaResize.y = Number(parentBody.style.top.split('px')[0])
    
            elementControl.state.isResize = true
            elementControl.state.resizeTargetElementId = elementId
            elementControl.state.resizeDirection = direction
    
        },
        action: function (x, y) {
            elementControl.state.isDrag = false

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

            elementTimeline[elementId].location.y = Number(targetBody.style.top.split('px')[0])
            elementTimeline[elementId].location.x = Number(targetBody.style.left.split('px')[0])
            elementTimeline[elementId].width = Number(targetBody.style.width.split('px')[0])
            elementTimeline[elementId].height = Number(targetBody.style.height.split('px')[0])
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
                <div id="element-${elementId}" class="element-drag" style='width: ${elementTimeline[elementId].width}px; height: ${elementTimeline[elementId].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">
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
                <div id="element-${elementId}" class="element-drag" style='width: ${elementTimeline[elementId].width}px; height: ${elementTimeline[elementId].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">
                <video src="${blob}" alt="" class="element-video" draggable="false"></video>
                <div class="resize-n" onmousedown="nugget.element.control.resize.init('${elementId}', 'n')"></div>
                <div class="resize-s" onmousedown="nugget.element.control.resize.init('${elementId}', 's')"></div>
                <div class="resize-w" onmousedown="nugget.element.control.resize.init('${elementId}', 'w')"></div>
                <div class="resize-e" onmousedown="nugget.element.control.resize.init('${elementId}', 'e')"></div>
    
                </div>
                `)
                let video = document.getElementById(`element-${elementId}`).querySelector("video")
                let secondsOfRelativeTime = (elementTimeline[elementId].startTime - elementPlayer.progress) / 200

                video.currentTime = secondsOfRelativeTime

            } else {
                let video = document.getElementById(`element-${elementId}`).querySelector("video")
                let secondsOfRelativeTime = -(elementTimeline[elementId].startTime - elementPlayer.progress) / 200

                if (!!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2)) {
                    if (elementPlayer.isPaused) {
                        console.log('paused')

                    }
                    console.log('isPlaying')
                } else {
                    video.currentTime = secondsOfRelativeTime
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

        for(key in elementTimeline) {
            let blob = `blob:${location.origin}/${key}`
            let filetype = elementTimeline[key].filetype
            let condition = elementTimeline[key].startTime > elementPlayer.progress || 
                elementTimeline[key].startTime + elementTimeline[key].duration < elementPlayer.progress

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
        let video = document.getElementById(`element-${elementId}`).querySelector("video")
        video.pause()
    },
    pauseAllVideo: function () {
        let key;

        for(key in elementTimeline) {
            let filetype = elementTimeline[key].filetype

            if (filetype == 'video') {
                let video = document.getElementById(`element-${key}`).querySelector("video")
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