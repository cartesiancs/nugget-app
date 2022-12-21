
class MenuDropdownBody extends HTMLElement { 
    constructor() {
        super();
        this.x = this.getAttribute('top')
        this.y = this.getAttribute('left')


    }

    render(){
        const innerElements = this.innerHTML
        const template = this.template();

        this.innerHTML = template;
        this.style.display = "inline-block"
        this.querySelector("ul").innerHTML = innerElements
    }


    template() {
        return `
        <ul class="dropdown-menu show position-absolute " style="top: ${this.x}px; left: ${this.y}px; z-index: 6000;">

        </ul>`
    }

    mousedown() {
        setTimeout(() => {
            this.remove()
        }, 200);
    }


    connectedCallback() {
        this.render();

        document.addEventListener('click', this.mousedown.bind(this));

    }

    disconnectedCallback(){
        document.removeEventListener('click', this.mousedown.bind(this));

    }
}


class MenuDropdownItem extends HTMLElement { 
    constructor() {
        super();

        this.name = this.getAttribute('item-name') || "untitle"

    }

    render(){
        const template = this.template();
        this.innerHTML = template;

    }


    template() {
        return `<li><a class="dropdown-item">${this.name}</a></li>`
    }



    connectedCallback() {
        this.render();

    }
}

export { MenuDropdownBody, MenuDropdownItem }
