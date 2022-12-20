
class KeyframeEditor extends HTMLElement { 
    constructor() {
        super();
        this.timeline = document.querySelector("element-timeline").timeline

        this.elementId = this.getAttribute('element-id')

        this.tension = 1;
        this.divBody = undefined
        this.svgBody = undefined
        this.poly = undefined
        this.path = undefined
        
        this.points = [
            [0,0]
        ];
    }

    render(){
        const template = this.template();
        this.innerHTML = template;

        this.divBody = this.querySelector("div")
        this.svgBody = this.divBody.querySelector("svg")
        this.poly = this.svgBody.querySelector("polyline")
        this.path = this.svgBody.querySelector("path")

        this.poly.setAttribute("points", this.points);
        this.path.setAttribute("d", this.drawPath(this.points, this.tension));

        this.querySelector("div").classList.add("h-100", "position-relative")
        this.classList.add("h-100", "w-100", "position-absolute")

    }


    template() {
        return `
        <div>
        <svg class="keyframe-svg">
        <polyline />
        <path class="keyframe-path" />
        </svg>
        </div>
`
    }




    addPoint(e) {
        let x = Math.round(e.offsetX)
        let y = Math.round(e.offsetY)

        this.points.push([x, y])
        this.divBody.insertAdjacentHTML("beforeend", `<div class="position-absolute keyframe-point" style="top: ${y-4}px; left: ${x-4}px;"></div>`)
        this.path.setAttribute("d", this.drawPath(this.points, this.tension));

        let loadPointLength = this.points[this.points.length-1][0] - 1
        let allPoints = this.getInterpolatedPoints(loadPointLength)

        this.timeline[this.elementId].animation.isActivate = true
        this.timeline[this.elementId].animation.allpoints = allPoints

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


    
    getPointAt(x) {
        let from = 0;
        let to = this.path.getTotalLength();
        let current = (from + to) / 2;
        let point = this.path.getPointAtLength(current);
        
        while (Math.abs(point.x - x) > 0.5) {
            if (point.x < x)
                from = current;
            else
                to = current;
            current = (from + to) / 2;
            point = this.path.getPointAtLength(current);
        }
    
        return {
            x: point.x,
            y: point.y
        };
    }
    
    getInterpolatedPoints(loadPointLength) {
        let points = []
        let indexDivision = 4
        let indexAt = 0
    
        for (let index = 0; index < Math.round(loadPointLength / indexDivision); index++) {
            points.push(this.getPointAt(indexAt))
            indexAt += 4
        }
    
        return points
    }

    connectedCallback() {
        this.render();

        this.addEventListener("mousedown", this.addPoint.bind(this))

    }
}

export { KeyframeEditor }
