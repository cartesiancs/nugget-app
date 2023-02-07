class AssetBrowser extends HTMLElement { 
    constructor() {
        super();

        this.directory = ''
    }

    render(){
        const template = this.template();
        this.innerHTML = template;
    }

    template() {
        return `<div class="row p-0 mt-2">
        <div class="col-2">
            <button class="btn btn-transparent btn-sm"><span class="material-symbols-outlined icon-sm"> arrow_upward </span> </button>
        </div>
        <div class="col-10">
            <input type="text" class="form-control" aria-describedby="basic-addon1" value="" disabled>
        </div>
        </div>`
    }

    updateDirectoryInput(path) {
        let directoryInput = this.querySelector("div").querySelectorAll("div")[1].querySelector("input")
        directoryInput.value = path
    }

    clickPrevDirectoryButton() {
        this.directory = document.querySelector("asset-list").nowDirectory
        if (this.directory == '') {
            return 0
        }

        let splitNowDirectory = this.directory.split('/')
        let splitPrevDirectory = splitNowDirectory.slice(-splitNowDirectory.length, -1)

        ipc.requestAllDir(splitPrevDirectory.join('/'))
    }


    connectedCallback() {
        this.render();

        let prevDirectoryButton = this.querySelector("div").querySelectorAll("div")[0].querySelector("button")
        prevDirectoryButton.addEventListener('click', this.clickPrevDirectoryButton.bind(this));
    }

    disconnectedCallback(){
        let prevDirectoryButton = this.querySelector("div").querySelectorAll("div")[0].querySelector("button")
        prevDirectoryButton.removeEventListener('click', this.clickPrevDirectoryButton);
    }

}


export { AssetBrowser }