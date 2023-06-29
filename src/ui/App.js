import React from 'react';
import { SplitTop, SplitBottom, SplitColumns } from './block/split.js'
import { Container } from './block/container.js'


function App(props) {
    const elementControl =  {
        play() {

        },

        reset() {

        }
    }
    
    //document.querySelector("element-control")

    const handleClickAddText = () => {
        document.querySelector("element-control").addText()
    }


    const handleCloseKeyframeEditor = () => {
        document.querySelector('keyframe-editor').hideKeyframeEditorButtonGroup()
    }

    const elementControlComponent = document.querySelector("element-control")
let preview = document.getElementById('preview');
let control = document.getElementById('control-inner');
let video = document.getElementById('video');
let exportVideoModal = new bootstrap.Modal(document.getElementById('exportVideoModal'), {
    keyboard: false
})





let toastElList = [].slice.call(document.querySelectorAll('.toast'))
let toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl)
})

HTMLCanvasElement.prototype.render = function () {
    nugget.canvas.preview.render(this)
};

HTMLCanvasElement.prototype.clear = function () {
    nugget.canvas.preview.clear(this)
};


window.onresize = async function(event) {
    await elementControlComponent.resizeEvent()
};

window.addEventListener('load', (event) => {
    auth.checkLogin()
    window.electronAPI.req.app.getAppInfo().then((result) => {
        document.querySelector("p[ref='appVersion']").innerHTML = `Nugget v${result.data.version}`
    })
});



// document.getElementById("split_inner_bottom").addEventListener("mousedown", (e) => {
//     e.stopPropagation();
// })



 
  return <>
  <Container>
    <SplitTop>            
                <div id="split_col_1" className="bg-darker h-100 overflow-y-hidden overflow-x-hidden position-relative p-0" style={ {width: "30%"} }>
                    <SplitColumns target={1}></SplitColumns>

                    <div className=" h-100 w-100 overflow-y-hidden overflow-x-hidden position-absolute ">

                        <div className="d-flex align-items-start h-100">
                            <div id="sidebar" className="nav flex-column nav-pills bg-dark h-100 pt-1" style={ {width: "2.5rem"} } role="tablist" aria-orientation="vertical">

                                <button className="btn-nav active" data-bs-toggle="pill" data-bs-target="#nav-home" type="button" role="tab" aria-selected="true"><span className="material-symbols-outlined">
                                    settings</span>
                                </button>

                                <button className="btn-nav" data-bs-toggle="pill" data-bs-target="#nav-draft" type="button" role="tab" aria-selected="false"><span className="material-symbols-outlined">
                                    draft</span>
                                </button>

                                <button className="btn-nav" data-bs-toggle="pill" data-bs-target="#nav-text" type="button" role="tab" aria-selected="false"><span className="material-symbols-outlined">
                                    text_fields</span>
                                </button>

                                <button className="btn-nav" data-bs-toggle="pill" data-bs-target="#nav-option" type="button" role="tab" aria-selected="false"><span className="material-symbols-outlined">
                                    extension</span>
                                </button>
                           
                                <button className="btn-nav" data-bs-toggle="pill" data-bs-target="#nav-output" type="button" role="tab" aria-selected="false"><span className="material-symbols-outlined">
                                    output</span>
                                </button>


                                
                            </div>
                            <div className="tab-content overflow-y-scroll overflow-x-hidden  p-2 h-100" style={ {width: "calc(100% - 2.5rem)"} }>


                              <div className="tab-pane fade show active" id="nav-home" role="tabpanel">
                                <p className="text-secondary" id="appVersion"></p>


                                <input id="projectFile" type="text" className="d-none" name="" />

                                <div className="input-group mb-3">
                                    <input id="projectFolder" type="text" className="form-control bg-default text-light" placeholder="/" disabled />
                                    <button className="btn btn-sm btn-default text-light" onClick={NUGGET.directory.select}>프로젝트 폴더 지정</button>
                                </div>
                                
                                <div className="input-group mb-3">
                                    <input id="projectDuration" type="number" className="form-control bg-default text-light" placeholder="진행초 e.g) 0"  defaultValue="10"  /> 
                                    {/* onChange={document.querySelector('element-timeline-ruler').updateRulerLength(this)} */}
                                    <span className="input-group-text bg-default text-light" id="basic-addon2">초</span>
                                </div>
                                <button className="btn btn-sm btn-default text-light mt-1" onClick={NUGGET.project.save}>프로젝트 저장</button>
                                <button className="btn btn-sm btn-default text-light mt-1" onClick={NUGGET.project.load}>프로젝트 불러오기</button>
                                <br />

                                <button type="button" className="btn btn-sm btn-default text-light mt-1" data-bs-toggle="modal" data-bs-target="#shortKey">
                                    <span className="material-symbols-outlined">
                                        keyboard
                                        </span>
                                  </button>
                                  
                                <br />
                              </div>

                              <div className="tab-pane fade" id="nav-draft" role="tabpanel" >
                                <asset-browser></asset-browser>
                                <asset-list></asset-list>
                              </div>

                              <div className="tab-pane fade" id="nav-text" role="tabpanel" >
                                <div className="row px-2">
                                    <div className="col-4 d-flex flex-column bd-highlight overflow-hidden mt-1 asset" onClick={handleClickAddText}>
                                        <span className="material-symbols-outlined icon-lg align-self-center"> text_fields </span>
                                        <b className="align-self-center text-ellipsis text-light text-center">텍스트</b>
                                    </div>
                                </div>
                              </div>


                              <div className="tab-pane fade" id="nav-option" role="tabpanel" >
                                <button className="btn btn-sm btn-default text-light mt-1" onClick={ipc.extTest}>익스텐션 폴더 불러오기 <span className="material-symbols-outlined icon-xs">
                                    developer_mode
                                </span></button>

                                <button className="btn btn-sm btn-default text-light mt-1" onClick={ipc.ext}>익스텐션 파일 불러오기</button>
                                <br />

                                <div id="extension_webview" className="mt-2">
                                    <webview src="https://nugget.studio/"></webview>

                                </div>





                              </div>


                              <div className="tab-pane fade" id="nav-output" role="tabpanel" >

                                <label className="form-label text-light">화질 설정</label>
                                <br />
                                <div className="text-light mb-2">
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="inputCheckBitrate" id="bitrate_row" value="1000" disabled readOnly />
                                        <label className="form-check-label">낮음</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="inputCheckBitrate" id="bitrate_high" value="5000" checked={true} readOnly />
                                        <label className="form-check-label">높음</label>
                                    </div>
                                </div>

                                <label className="form-label text-light">해상도</label>
                                <br />
                                <div className="text-light mb-2">
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="inputCheckQuality" id="quality_hd" value="1280x720" disabled readOnly />
                                        <label className="form-check-label">1280x720 HD</label>
                                    </div>
                                    <div className="form-check form-check-inline">
                                        <input className="form-check-input" type="radio" name="inputCheckQuality" id="quality_fhd" value="1920x1080" checked={true} readOnly />
                                        <label className="form-check-label">1080x1920 FHD</label>
                                    </div>
                                </div>

                                <button className="btn btn-blue-fill" onClick={ipc.render}>Export</button>
                              </div>

                            </div>
                        </div>

                    </div>

                </div>

                <div id="split_col_2" className="h-100 position-relative d-flex align-items-center justify-content-center" style={ {width: "50%"} }>

                    <SplitColumns target={2}></SplitColumns>

                    <div id="videobox">
                        <div className="d-flex justify-content-center">
                            <div id="video" className="video">
                                <canvas id="preview" className="preview"></canvas>
                                <element-control></element-control>
                                <drag-alignment-guide></drag-alignment-guide>
                            </div>
                        </div>

  
                    </div>
                </div>

                <div id="split_col_3" className="bg-darker h-100 overflow-y-hidden overflow-x-hidden position-relative p-2" style={ {width: "20%"} }>
                    <input type="hidden" id="optionTargetElement" value="aaaa-aaaa-aaaa-aaaa" readOnly />


                    <option-group>
                        <option-text></option-text>
                        <option-image></option-image>
                        <option-video></option-video>
                        <option-audio></option-audio>

                    </option-group>

                </div>
    </SplitTop>
    <SplitBottom>
        <div className="row mb-2">
            <div className="col-4">
                <div className="d-flex justify-content-start">
                    <button id="playToggle" className="btn btn-xs btn-transparent" onClick={elementControl.play()}><span className="material-symbols-outlined icon-white icon-md"> play_circle </span></button>
                    <button className="btn btn-xs btn-transparent ms-2" onClick={elementControl.reset()}><span className="material-symbols-outlined icon-white icon-md"> replay_circle_filled </span></button>
                    <b id="time" className="text-light ms-2">00:00:00.00</b>
                </div>
            </div>
            <div className="col-5">
                <div id="keyframeEditorButtonGroup" className="d-none">
                    <button type="button" className="btn btn-dark btn-sm" data-bs-dismiss="offcanvas" onClick={handleCloseKeyframeEditor} aria-label="close">키프레임 에디터 닫기</button>
                    <div className="btn-group" role="group" id="timelineOptionLineEditor">
                    </div>
                </div>
            </div>

            <div className="col-3 row d-flex align-items-center">
                <element-timeline-range></element-timeline-range>
            </div>

        </div>
        <element-timeline-ruler></element-timeline-ruler>
        <element-timeline id="split_inner_bottom"></element-timeline>

    </SplitBottom>
  </Container>

  </>;
}

export { App }