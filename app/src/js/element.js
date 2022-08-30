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
        body.insertAdjacentHTML("beforeend", `<div class="element-bar" style="width: 1000px; left: 0px;" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${blob}">
            ${blob}
            <div class="element-bar-resize-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'left')"></div>
            <div class="element-bar-resize-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'right')"></div>

        </div>`)
    },
    drag: function (x, y) {
        valueEvent.elementBar.e.style.left = `${x}px`
        let elementId = valueEvent.elementBar.blob .split('/')[3]
        nugget.element.timeline[elementId].startTime = x
    },
    resizeTime: function (x, location = 'left') {
        let elementId = valueEvent.elementBar.blob .split('/')[3]
        let duration = valueEvent.elementBar.criteria.duration 

        if (location == 'left') {
            valueEvent.elementBar.e.style.left = `${x}px`
            valueEvent.elementBar.e.style.width = `${duration-x}px`
            nugget.element.timeline[elementId].startTime = x
            nugget.element.timeline[elementId].duration = Number(valueEvent.elementBar.e.style.width.split('px')[0])
        } else {
            valueEvent.elementBar.e.style.left = `${valueEvent.elementBar.criteriaResize.x}px`
            valueEvent.elementBar.e.style.width = `${valueEvent.mouse.x-valueEvent.elementBar.criteriaResize.x}px`

            nugget.element.timeline[elementId].startTime = valueEvent.elementBar.criteriaResize.x
            nugget.element.timeline[elementId].duration = Number(valueEvent.elementBar.e.style.width.split('px')[0])

        }
        



        //valueEvent.elementBar.e.style.left = `${x}px`

    }
}

const elementControl = {
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
                    localpath: path
                }

                elementPreview.show(blob)
            }
        }
    },
    drag: function (target, x, y) {
        let elementId = target.querySelector("img").getAttribute('src').split('/')[3]
        target.style.top = `${y}px`
        target.style.left = `${x}px`
        //target.style.transform = `translate(${x}px, ${y}px)`
        nugget.element.timeline[elementId].location.x = x 
        nugget.element.timeline[elementId].location.y = y
        preview.clear();
        preview.render();
    },
    dragover: function (event) {
        event.stopPropagation();
        event.preventDefault();
    },
    drop: function (event) {
        event.stopPropagation();
        event.preventDefault();
    }
}

const elementPreview = {
    show: function (blob) {
        let elementId = blob.split('/')[3]
        if (document.getElementById(`element-${elementId}`) == null) {
            control.insertAdjacentHTML("beforeend", `
            <div id="element-${elementId}" class="element-drag" style='width: ${nugget.element.timeline[elementId].width}px; top: 0px; left: 0px;' draggable="true">
            <img src="${blob}" alt="" class="element-image" draggable="false">
            </div>
            `)
        } else {
            document.querySelector(`#element-${elementId}`).classList.remove('d-none')
        }

    },
    hide: function (blob) {
        let elementId = blob.split('/')[3]
        document.querySelector(`#element-${elementId}`).classList.add('d-none')
    },
    play: function () {
        let key;
        preview.render();

        for(key in nugget.element.timeline) {
            let blob = `blob:${location.origin}/${key}`

            if (nugget.element.timeline[key].startTime > elementPlayer.progress || nugget.element.timeline[key].startTime + nugget.element.timeline[key].duration < elementPlayer.progress) {
                elementPreview.hide(blob)
            } else {
                elementPreview.show(blob)
            }
        }
    }
}


const element = {
    timeline: elementTimeline,
    player: elementPlayer,
    bar: elementBar,
    control: elementControl,
    preview: elementPreview
}

export default element