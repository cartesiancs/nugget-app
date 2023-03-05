
class SelectFont extends HTMLElement { 
    constructor() {
        super();


        this.path = ''

    }

    render() {
        let template = this.template()
        this.innerHTML = template
        this.insertFontLists()

    }

    template() {
        return `<select ref='lists' class="form-select" aria-label="Default select example">
        <option selected>Noto Sans KR medium</option>

      </select>`;
    }

    insertFontLists() {
        window.electronAPI.req.font.getLists().then((result) => {
            if (result.status == 0) {
                return 0
            }

            for (let index = 0; index < result.fonts.length; index++) {
                const font = result.fonts[index];
                this.querySelector("select[ref='lists']").insertAdjacentHTML("beforeend", `<option value-index="${index + 1}" value='${font.path}'>${font.name}</option>`)

            }
        })
    }

    handleSelect() {
        this.path = this.querySelector("select[ref='lists']").value

    }

    connectedCallback() {
        this.render();
        this.querySelector("select[ref='lists']").addEventListener("change", this.handleSelect.bind(this))
    }
}

  
export { SelectFont }
