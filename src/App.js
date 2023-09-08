import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';




class App extends LitElement {
    // constructor() {
    //     super()
    // }

    // connectedCallback() {
    //     console.log( this.render())

    //     this.classList.add("bg-darker")

    //     this.innerHTML = this.render()
    // }

    createRenderRoot() {
        return this;
    }

    render() {
        return html`

        <asset-upload-drop></asset-upload-drop>
        <tutorial-group>
            <tutorial-popover tutorial-idx="1" tutorial-title="test" tutorial-message="fsdf" target-element-id="split_col_1"></tutorial-popover>
        </tutorial-group>
            <body class="h-100 bg-dark">
        
                <div id="app"></div>
        
                <div class="container-fluid" style="height: 97vh;">

        
                    <control-ui id="split_top" class="row align-items-start" style="height: 80%;"></control-ui>
                    <timeline-ui id="split_bottom" class="row position-relative split-top align-items-end bg-darker line-top" style="height: 20%;"></timeline-ui>

                </div>
        
        
        
                <!-- 
                    OPTION
                -->
                <div class="offcanvas offcanvas-start" data-bs-scroll="true"  data-bs-backdrop="false" tabindex="-1" id="option_top" aria-labelledby="offcanvasRightLabel" style="width: 30%;">
                    <div class="offcanvas-header">
                        <h5 id="offcanvasRightLabel" class="text-light ms-3 mt-1">옵션</h5>
                        <button type="button" class="btn btn-transparent btn-sm" data-bs-dismiss="offcanvas" aria-label="Close"><span class="material-symbols-outlined icon-white">close</span></button>
                    </div>
                    <div class="offcanvas-body">
        
        
                    </div>
                </div>
        
        
                <!-- 
                    TIMELINE OPTION
                -->
                <div class="offcanvas offcanvas-bottom" data-bs-scroll="true"  data-bs-backdrop="false" tabindex="-1" id="option_bottom" aria-labelledby="offcanvasRightLabel" style="height: calc(20% - 2rem); ">
                    <div class="offcanvas-header row d-flex justify-content-between">
                        <div class="col">
        
                        </div>
                        <div class="col text-end">
        
                        </div>
        
                    </div>
                    <div class="">
                        <input type="hidden" id="timelineOptionTargetElement" value="aaaa-aaaa-aaaa-aaaa">
        
                        <div id="timelineOptionBody" class="d-none">
        
                        </div>
        
                    </div>
                </div>
        
                <!-- 
                    MODAL
                -->
                <modal-list-ui></modal-list-ui>
        
        
                <div class="toast-container position-fixed bottom-50 start-50 translate-middle">
                    <div class="toast fade hide" id="loadMetadataToast" role="alert" data-bs-animation="true" data-bs-autohide="true" data-bs-delay="9000" aria-live="assertive" aria-atomic="true" style="background-color: rgba(37, 38, 43, 0.73);">
                        <div class="toast-body"> 
                            <div class="text-center text-light">메타데이터 불러오는중</div> 
                            <div class="progress mt-2 mb-1">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                </div>
        
        
        
                <div id="menuRightClick"></div>
        
                <toast-box></toast-box>
        
`
    }
}

export { App }