
class SelectFont extends HTMLElement { 
    constructor() {
        super();


        this.path = ''
        this.type = ''
        this.fontname = ''
        this.onChangeSelect = new Event('onChangeSelect');


    }

    render() {
        let template = this.template()
        this.innerHTML = template
        this.insertFontLists()

    }

    template() {
        return `<select ref='lists' class="form-select form-control bg-default text-light" aria-label="Default select example">
        <option selected>Select</option>

      </select>
      <style ref='fontStyles'>
      </style>
      `;
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
        this.fontname = this.querySelector("select[ref='lists']").value.split('/')[this.querySelector("select[ref='lists']").value.split('/').length - 1].split(".")[0]
        this.type = this.querySelector("select[ref='lists']").value.split('/')[this.querySelector("select[ref='lists']").value.split('/').length - 1].split(".")[1]

        this.applyFontStyle({
            fontName: this.fontname,
            fontPath: this.path,
            fontType: this.type 
        })

        this.dispatchEvent(this.onChangeSelect);

    }

    applyFontStyle({ fontName, fontPath, fontType }) {
        this.querySelector("style[ref='fontStyles']").insertAdjacentHTML("beforeend", `
        @font-face {
            font-family: "${fontName}";
            src: local("${fontName}"),
              url("${fontPath}") format("${fontType}");
        }
        `)
    }

    connectedCallback() {
        this.render();
        this.querySelector("select[ref='lists']").addEventListener("change", this.handleSelect.bind(this))
    }
}

  
export { SelectFont }
