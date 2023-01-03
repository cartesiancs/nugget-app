
class KeyframeEditor extends HTMLElement { 
    constructor() {
        super();
        this.timeline = document.querySelector("element-timeline").timeline

        this.elementId = this.getAttribute('element-id')
        this.animationType = this.getAttribute('animation-type')

        this.tension = 1;
        this.divBody = undefined
        this.svgBody = {}
        this.poly = {}
        this.path = {}
        
        this.lineCount = 1
        this.points = [
            [[0,0]], [[0,0]]
        ];

        this.selectLine = 0
    }

    render(){
        const template = this.template();
        this.innerHTML = template;

        this.divBody = this.querySelector("div")
        this.svgBody = this.divBody.querySelector("svg")
        this.lineCount = this.timeline[this.elementId].animation[this.animationType].points.length

        for (let line = 0; line < this.lineCount; line++) {
            this.addLineEditor(line)
            this.drawLine(line)
            this.loadPoint(line)
        }


        this.querySelector("div").classList.add("h-100", "position-relative")
        this.classList.add("h-100", "w-100", "position-absolute")


        let animationPanel = document.querySelector(`animation-panel[element-id="${this.elementId}"]`)
        animationPanel.updateItem()   


    }


    template() {
        return `
        <div>
        <svg class="keyframe-svg">

        </svg>
        </div>
`
    }

    highlightLineEditorButton(line) {
        for (let index = 0; index < this.lineCount; index++) {
            let button = document.querySelector("#timelineOptionLineEditor").querySelector(`button[line='${index}']`)
            button.classList.remove("btn-primary")
            button.classList.add("btn-secondary")
        }

        let targeButton = document.querySelector("#timelineOptionLineEditor").querySelector(`button[line='${line}']`)
        targeButton.classList.remove("btn-secondary")
        targeButton.classList.add("btn-primary")

    }

    changeLineEditor(line) {
        this.selectLine = Number(line)
        this.highlightLineEditorButton(line)
        
    }

    addLineEditor(line) {
        document.querySelector("#timelineOptionLineEditor").insertAdjacentHTML("beforeend", 
        `<button line="${line}" onclick="document.querySelector('keyframe-editor').changeLineEditor('${line}')" type="button" class="btn btn-secondary btn-sm">Line${line}</button>`)
        
    }



    loadPoint(line) {
        if (this.timeline[this.elementId].animation[this.animationType].isActivate == true) {
            let points = this.timeline[this.elementId].animation[this.animationType].points[line]
            console.log(points)
            for (let index = 0; index < points.length; index++) {
                const element = points[index];
                if (element[0] == 0) {
                    continue;
                }
                this.addPoint({
                    x: element[0], 
                    y: element[1],
                    line: line
                })
            }
        }
    }

    addPoint({ x, y, line }) {

        this.points[line].push([Math.round(x), Math.round(y)])
        this.divBody.insertAdjacentHTML("beforeend", `<div class="position-absolute keyframe-point" style="top: ${y-4}px; left: ${x-4}px;"></div>`)
        this.path[line].setAttribute("d", this.drawPath(this.points[line], this.tension));

        let loadPointLength = this.points[line][this.points[line].length-1][0] - 1
        let allPoints = this.getInterpolatedPoints(loadPointLength, line)

        this.timeline[this.elementId].animation[this.animationType].isActivate = true
        this.timeline[this.elementId].animation[this.animationType].points[line] = this.points[line]
        this.timeline[this.elementId].animation[this.animationType].allpoints[line] = allPoints

    }

    drawLine(line) {
        this.querySelector("svg").insertAdjacentHTML("beforeend", `
        <polyline id="keyframePolyline${line}" />
        <path id="keyframePath${line}" class="keyframe-path" />`)

        //this.poly[line] = this.svgBody[line].querySelector("polyline")
        this.path[line] = this.svgBody.querySelector(`path[id='keyframePath${line}']`)

        //this.poly.setAttribute("points", this.points[line]);
        this.path[line].setAttribute("d", this.drawPath(this.points[line], this.tension));
    }


    drawPath(points, tension) {
        if (tension == null) tension = 1;
        let size = points.length * 2;
        let last = size - 4;    
        let path = "M" + [points[0][0], points[0][1]];
        let now = 0
    
        for (let i = 0; i < size - 2; i +=2) {
            let x0 = now ? points[now-1][0] : points[0][0];
            let y0 = now ? points[now-1][1] : points[0][1];
            let x1 = points[now][0];
            let y1 = points[now][1];
            let x2 = points[now+1][0];
            let y2 = points[now+1][1];
            let x3 = i !== last ? points[now+2][0] : x2;
            let y3 = i !== last ? points[now+2][1] : y2;
            let cp1x = x1 + (x2 - x0) / 6 * tension;
            let cp1y = y1 + (y2 - y0) / 6 * tension;
            let cp2x = x2 - (x3 - x1) / 6 * tension;
            let cp2y = y2 - (y3 - y1) / 6 * tension;
            now += 1
            path += "C" + [cp1x, cp1y, cp2x, cp2y, x2, y2];
        } 
        return path;
    }


    
    getPointAt(x, line) {
        let from = 0;
        let to = this.path[line].getTotalLength();
        let current = (from + to) / 2;
        let point = this.path[line].getPointAtLength(current);
        
        while (Math.abs(point.x - x) > 0.5) {
            if (point.x < x)
                from = current;
            else
                to = current;
            current = (from + to) / 2;
            point = this.path[line].getPointAtLength(current);
        }
    
        return {
            x: point.x,
            y: point.y
        };
    }
    
    getInterpolatedPoints(loadPointLength, line) {
        let points = []
        let indexDivision = 4
        let indexAt = 0
    
        for (let index = 0; index < Math.round(loadPointLength / indexDivision); index++) {
            points.push(this.getPointAt(indexAt, line))
            indexAt += 4
        }
    
        return points
    }

    handleMousedown(e) {
        this.addPoint({
            x: e.offsetX,
            y: e.offsetY,
            line: this.selectLine
        })

        let animationPanel = document.querySelector(`animation-panel[element-id="${this.elementId}"]`)
        animationPanel.updateItem()   
    }

    connectedCallback() {
        this.render();

        this.addEventListener("mousedown", this.handleMousedown.bind(this))

    }
}

export { KeyframeEditor }
