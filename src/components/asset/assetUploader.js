class AssetDropUploader extends HTMLElement { 
    constructor() {
        super();

    }

    render(){
        const template = this.template();

        this.classList.add("bg-dark", "position-absolute", "d-none")
        this.style.left = '0px'
        this.style.top = '0px'
        this.style.width = '100%'
        this.style.height = '100%'
        this.style.zIndex = "10000"
        this.style.opacity = '80%'
        this.style.paddingTop = '46vh'

        this.innerHTML = template;
    }

    template() {
        return `
        <div class="row justify-content-center align-items-start">
            <b class="col-12 align-self-center text-light position-fixed text-center">
                여기에 파일을 드롭해주세요
            </b>
        </div>`
    }




    handleDragEnter() {
        this.classList.remove("d-none")
    }

    handleDragOver(e) {
        e.preventDefault();

        this.classList.remove("d-none")
    }

    handleDragLeave() {
        this.classList.add("d-none")
    }

    handleDrop(e) {
        e.preventDefault();
        let filePath = e.dataTransfer.files[0].path
        NUGGET.asset.add(filePath)
        this.classList.add("d-none")
    }



    connectedCallback() {
        this.render();

        document.addEventListener('dragenter', this.handleDragEnter.bind(this))
        document.addEventListener('dragover', this.handleDragOver.bind(this))
        this.addEventListener('dragleave', this.handleDragLeave.bind(this))
        this.addEventListener('drop', this.handleDrop.bind(this))

    }

    disconnectedCallback(){

    }

}


export { AssetDropUploader }