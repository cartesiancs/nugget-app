var NUGGET;(()=>{"use strict";var e={d:(t,i)=>{for(var s in i)e.o(i,s)&&!e.o(t,s)&&Object.defineProperty(t,s,{enumerable:!0,get:i[s]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{asset:()=>b,canvas:()=>y,directory:()=>f,element:()=>p});const i={randomUUID:"undefined"!=typeof crypto&&crypto.randomUUID&&crypto.randomUUID.bind(crypto)};let s;const n=new Uint8Array(16);function l(){if(!s&&(s="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto),!s))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return s(n)}const o=[];for(let e=0;e<256;++e)o.push((e+256).toString(16).slice(1));const r=function(e,t,s){if(i.randomUUID&&!t&&!e)return i.randomUUID();const n=(e=e||{}).random||(e.rng||l)();if(n[6]=15&n[6]|64,n[8]=63&n[8]|128,t){s=s||0;for(let e=0;e<16;++e)t[s+e]=n[e];return t}return function(e,t=0){return(o[e[t+0]]+o[e[t+1]]+o[e[t+2]]+o[e[t+3]]+"-"+o[e[t+4]]+o[e[t+5]]+"-"+o[e[t+6]]+o[e[t+7]]+"-"+o[e[t+8]]+o[e[t+9]]+"-"+o[e[t+10]]+o[e[t+11]]+o[e[t+12]]+o[e[t+13]]+o[e[t+14]]+o[e[t+15]]).toLowerCase()}(n)},a={},d={},m={scroller:void 0,isPaused:!0,progress:split_inner_bottom.scrollLeft,start:function(){let e=document.querySelector("#playToggle");e.setAttribute("onclick","nugget.element.player.stop()"),e.innerHTML='<span class="material-symbols-outlined icon-white icon-md"> stop_circle </span>',m.scroller=setInterval((function(){let e=Number(timeline_bar.style.left.split("px")[0])+4;timeline_bar.style.left=`${e}px`,m.progress=e,split_inner_bottom.innerWidth+split_inner_bottom.offsetWidth>=split_inner_bottom.offsetWidth&&m.stop(),h.play()}),20),m.isPaused=!1},stop:function(){clearInterval(m.scroller),m.isPaused=!0;let e=document.querySelector("#playToggle");e.setAttribute("onclick","nugget.element.player.start()"),e.innerHTML='<span class="material-symbols-outlined icon-white icon-md"> play_circle </span>',h.pauseAllVideo()},reset:function(){timeline_bar.style.left="0px",m.progress=0,m.isPaused=!0}},c={state:{isDrag:!1,isResize:!1,resizeLocation:"left",resizeRangeLeft:0,resizeRangeRight:0,e:void 0,blob:"",elementId:"",criteria:{x:0,y:0,duration:1e3},criteriaResize:{x:0,y:0}},event:{drag:{onmousedown:function(e){c.state.elementId=e.getAttribute("value"),c.state.isDrag=!0,c.state.e=e,c.state.criteria.x=valueEvent.mouse.x-Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.criteria.y=valueEvent.mouse.y},onmouseup:function(e){c.state.isDrag=!1}},resize:{onmousedownrange:function(e,t="left"){c.state.e=e.parentNode.parentNode,c.state.elementId=c.state.e.getAttribute("value"),c.state.isResize=!0,c.state.resizeLocation=t,c.state.isDrag=!1,c.state.criteria.duration=a[c.state.elementId].duration+Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.criteriaResize.x=Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.resizeRangeLeft=Number(c.state.e.querySelector(".element-bar-hiddenspace-left").style.width.split("px")[0]),c.state.resizeRangeRight=Number(c.state.e.querySelector(".element-bar-hiddenspace-right").style.width.split("px")[0])},onmousedown:function(e,t="left"){c.state.elementId=e.parentNode.getAttribute("value"),c.state.isResize=!0,c.state.resizeLocation=t,c.state.isDrag=!1,c.state.e=e.parentNode,c.state.criteriaResize.x="left"==t?valueEvent.mouse.x-Number(c.state.e.style.left.replace(/[^0-9]/g,"")):Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.criteriaResize.y=valueEvent.mouse.y,c.state.criteria.duration=a[c.state.elementId].duration+Number(c.state.e.style.left.replace(/[^0-9]/g,""))},onmouseup:function(e){c.state.isResize=!1}}},append:function(e){let t,i=document.querySelector("#split_inner_bottom"),s=a[e].duration,n=a[e].filetype,l=a[e].localpath.split("/"),o=l[l.length-1],r=c.getRandomColor();"video"==n&&(t=`<div class="element-bar" style="width: ${s}px; left: 0px; background-color: ${r};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${e}">\n            ${o}\n            <div class="element-bar-hiddenspace-left position-absolute">\n                <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'left')">\n                </div>\n            </div>\n            <div class="element-bar-hiddenspace-right position-absolute">\n                <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'right')">\n                </div>\n            </div>\n            </div>`);let d="video"!=n?`<div class="element-bar" style="width: ${s}px; left: 0px; background-color: ${r};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${e}">\n            ${o}\n            <div class="element-bar-resize-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'left')"></div>\n            <div class="element-bar-resize-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'right')"></div>\n            </div>`:t;i.insertAdjacentHTML("beforeend",d)},drag:function(e,t){let i=c.state.elementId;c.state.e.style.left=`${e}px`,a[i].startTime=e},resizeDurationInTimeline:function(e,t="left"){let i=c.state.elementId,s=c.state.criteria.duration;"left"==t?(c.state.e.style.left=`${e}px`,c.state.e.style.width=s-e+"px",a[i].startTime=e,a[i].duration=Number(c.state.e.style.width.split("px")[0])):(c.state.e.style.left=`${c.state.criteriaResize.x}px`,c.state.e.style.width=split_inner_bottom.scrollLeft+valueEvent.mouse.x-c.state.criteriaResize.x+"px",a[i].startTime=c.state.criteriaResize.x,a[i].duration=Number(c.state.e.style.width.split("px")[0]))},resizeRangeOnElement:function(e,t="left"){let i=c.state.elementId,s=c.state.criteria.duration,n=Number(c.state.e.style.width.split("px")[0]),l=(c.state.resizeRangeLeft,c.state.resizeRangeRight,c.state.e.querySelector(".element-bar-hiddenspace-left")),o=c.state.e.querySelector(".element-bar-hiddenspace-right"),r=window.innerWidth,d=split_inner_bottom.scrollWidth,m=Number(c.state.e.style.left.split("px")[0]),u=d-r-split_inner_bottom.scrollLeft,h=r-n-m>0?r-n-m-10:0;"left"==t?(l.style.width=e+split_inner_bottom.scrollLeft-5+"px",a[i].trim.startTime=Number(l.style.width.split("px")[0])):(o.style.width=u+window.innerWidth-e-c.state.criteriaResize.x-h+"px",a[i].trim.endTime=s-Number(o.style.width.split("px")[0]))},getRandomColor:function(){return"#"+Math.round(16777215*Math.random()).toString(16)+"51"}},u={state:{activeElementId:"",isDrag:!1,isResize:!1,e:void 0,elementId:"",criteriaDrag:{x:0,y:0},criteriaResize:{x:0,y:0,w:0,h:0},resizeDirection:"",resizeTargetElementId:""},event:{click:{activateOutline:function(e){u.event.click.deactivateAllOutline(),u.state.activeElementId=e,document.querySelector(`#element-${e}`).classList.add("element-outline")},deactivateAllOutline:function(){console.log("S");for(const e in a)Object.hasOwnProperty.call(a,e)&&document.querySelector(`#element-${e}`).classList.remove("element-outline");u.state.activeElementId=""}},drag:{onmousedown:function(e){u.event.click.activateOutline(e.id.split("element-")[1]),u.state.isDrag=!0,u.state.e=e,u.state.criteriaDrag.x=valueEvent.mouse.x-Number(u.state.e.style.left.replace(/[^0-9]/g,"")),u.state.criteriaDrag.y=valueEvent.mouse.y-Number(u.state.e.style.top.replace(/[^0-9]/g,""))},onmouseup:function(e){u.state.isDrag=!1}},resize:{onmousedown:function(e,t="n"){let i=document.querySelector(`#element-${e}`);u.state.isDrag=!1,u.state.criteriaResize.w=Number(i.style.width.split("px")[0]),u.state.criteriaResize.h=Number(i.style.height.split("px")[0]),u.state.criteriaResize.x=Number(i.style.left.split("px")[0]),u.state.criteriaResize.y=Number(i.style.top.split("px")[0]),u.state.isResize=!0,u.state.resizeTargetElementId=e,u.state.resizeDirection=t}},textinput:{onkeyup:function(e){let t=document.querySelector(`#element-${e}`).querySelector("input").value;console.log(e,t),a[e].text=t}}},add:{image:function(e,t){let i=document.createElement("img"),s=u.generateUUID();i.src=e,i.onload=function(){var n=i.width/10,l=i.height/10;a[s]={startTime:0,duration:1e3,location:{x:0,y:0},width:n,height:l,localpath:t,filetype:"image"},d[s]={blob:e},h.show.image(s),c.append(s)}},video:function(e,t){let i=document.createElement("video"),s=u.generateUUID();i.src=e,i.preload="metadata",i.onloadedmetadata=function(){let n=i.videoWidth/10,l=i.videoHeight/10,o=200*i.duration;a[s]={startTime:0,duration:o,location:{x:0,y:0},trim:{startTime:0,endTime:o},width:n,height:l,localpath:t,filetype:"video"},d[s]={blob:e},h.show.video(s),c.append(s)}},text:function(){let e=u.generateUUID();a[e]={startTime:0,duration:1e3,text:"텍스트",location:{x:0,y:0},localpath:"/TESTELEMENT",filetype:"text"},h.show.text(e),c.append(e)}},drag:function(e,t){let i=u.state.e,s=["img","video","input"],n="";for(let e=0;e<s.length;e++)i.querySelector(s[e])&&(n=s[e]);let l=i.querySelector(n).parentNode.getAttribute("id").split("element-")[1];i.style.top=`${t}px`,i.style.left=`${e}px`,a[l].location.x=e,a[l].location.y=t},dragover:function(e){e.stopPropagation(),e.preventDefault()},drop:function(e){e.stopPropagation(),e.preventDefault()},onmouseup:function(e){u.state.isResize=!1,u.state.isDrag=!1;for(const e in a)Object.hasOwnProperty.call(a,e)&&document.querySelector(`#element-${e}`)},generateUUID:function(){return r()},resize:{action:function(e,t){u.state.isDrag=!1;let i=u.state.resizeTargetElementId,s=document.querySelector(`#element-${i}`);switch(u.state.resizeDirection){case"n":s.style.top=`${u.state.criteriaResize.y+t}px`,s.style.height=u.state.criteriaResize.h-t+"px";break;case"s":s.style.top=`${u.state.criteriaResize.y}px`,s.style.height=`${t}px`;break;case"w":s.style.left=`${u.state.criteriaResize.x+e}px`,s.style.width=u.state.criteriaResize.w-e+"px";break;case"e":s.style.left=`${u.state.criteriaResize.x}px`,s.style.width=`${e}px`}a[i].location.y=Number(s.style.top.split("px")[0]),a[i].location.x=Number(s.style.left.split("px")[0]),a[i].width=Number(s.style.width.split("px")[0]),a[i].height=Number(s.style.height.split("px")[0])}}},h={previewRatio:1920/preview.width,show:{image:function(e){let t=d[e].blob;null==document.getElementById(`element-${e}`)?control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='width: ${a[e].width}px; height: ${a[e].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)" onclick="nugget.element.control.event.click.activateOutline('${e}')">\n                <img src="${t}" alt="" class="element-image" draggable="false">\n                <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'e')"></div>\n    \n                </div>\n                `):document.querySelector(`#element-${e}`).classList.remove("d-none")},video:function(e){let t=d[e].blob;if(null==document.getElementById(`element-${e}`)){control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='width: ${a[e].width}px; height: ${a[e].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)" onclick="nugget.element.control.event.click.activateOutline('${e}')">\n                <video src="${t}" alt="" class="element-video" draggable="false"></video>\n                <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'e')"></div>\n    \n                </div>\n                `);let i=document.getElementById(`element-${e}`).querySelector("video"),s=(a[e].startTime-m.progress)/200;i.currentTime=s}else{let t=document.getElementById(`element-${e}`).querySelector("video"),i=-(a[e].startTime-m.progress)/200;t.currentTime>0&&!t.paused&&!t.ended&&t.readyState>2?(m.isPaused&&console.log("paused"),console.log("isPlaying")):(t.currentTime=i,t.play()),document.querySelector(`#element-${e}`).classList.remove("d-none")}},text:function(e){null==document.getElementById(`element-${e}`)?control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)" onclick="nugget.element.control.event.click.activateOutline('${e}')">\n                <input type="text" class="form-transparent element-text" draggable="false" onkeyup="nugget.element.control.event.textinput.onkeyup('${e}')" value="텍스트">\n                <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'e')"></div>\n    \n                </div>\n                `):document.querySelector(`#element-${e}`).classList.remove("d-none")}},hide:function(e){"video"==a[e].filetype&&h.pauseVideo(e),document.querySelector(`#element-${e}`).classList.add("d-none")},play:function(){let e;for(e in a){location.origin,d[e];let t=a[e].filetype,i=a[e].startTime>m.progress||a[e].startTime+a[e].duration<m.progress;"video"==t&&(i=a[e].startTime+a[e].trim.startTime>m.progress||a[e].startTime+a[e].trim.endTime<m.progress),i?h.hide(e):h.show[t](e)}},pauseVideo:function(e){document.getElementById(`element-${e}`).querySelector("video").pause()},pauseAllVideo:function(){let e;for(e in a)"video"==a[e].filetype&&document.getElementById(`element-${e}`).querySelector("video").pause()}},p={timeline:a,player:m,bar:c,control:u,preview:h},g={mediaRecorder:void 0,resize:function(){let e=document.getElementById("split_col_2").offsetWidth,t=(document.getElementById("split_col_2").offsetHeight,.95*e),i=9*t/16;preview.width=t,preview.height=i,preview.style.width=`${t}px`,preview.style.height=`${i}px`,video.style.width=`${t}px`,video.style.height=`${i}px`,nugget.element.preview.previewRatio=1920/t},render:function(e){let t,i=e.getContext("2d");for(t in preview.clear(),nugget.element.timeline){let e=`blob:${location.origin}/${t}`;if(nugget.element.timeline[t].startTime>nugget.element.player.progress||nugget.element.timeline[t].startTime+nugget.element.timeline[t].duration<nugget.element.player.progress);else{let s=new Image;s.src=e,i.drawImage(s,nugget.element.timeline[t].location.x,nugget.element.timeline[t].location.y,nugget.element.timeline[t].width,nugget.element.timeline[t].height)}}let s=document.getElementById("split_inner_bottom");s.scrollWidth-s.offsetWidth<=nugget.element.player.progress+1&&null!=g.mediaRecorder&&g.mediaRecorder.stop()},clear:function(e){preview.width=preview.width},export:function(){let e=[];return new Promise((function(t,i){let s=preview.captureStream(60);g.mediaRecorder=new MediaRecorder(s,{mimeType:"video/webm; codecs=vp9"}),g.mediaRecorder.start(0),g.mediaRecorder.ondataavailable=function(t){e.push(event.data)},g.mediaRecorder.onstop=function(i){let s=new Blob(e,{type:"video/webm"}),n=URL.createObjectURL(s);t({url:n,blobVideo:s}),exportVideo.src=n,exportVideoModal.show()},nugget.element.player.start(),g.render()}))}},y={preview:g},v={nowDirectory:"",loadPrevDirectory:function(){let e=v.nowDirectory.split("/"),t=e.slice(-e.length,-1);ipc.requestAllDir(t.join("/"))},add:function(e,t){fetch(`file://${e}`).then((e=>e.blob())).then((t=>{let i=URL.createObjectURL(t),s=t.type.split("/")[0],n=document.querySelector("element-control");"image"==s?n.addImage(i,e):"video"==s&&n.addVideo(i,e)}))}},b=v,f={select:function(){const e=document.createElement("input"),t=document.querySelector("#projectFolder");e.setAttribute("type","file"),e.setAttribute("webkitdirectory",""),e.click(),e.addEventListener("change",(function(){const e=this.files[0].path.split("/");e.pop();const i=e.join("/");t.value=i}),!1)}};class w extends HTMLElement{constructor(){super(),this.nowDirectory=""}render(){const e=this.template();this.innerHTML=e}template(){return'<div class="row px-2"></div>'}getFile(e){let t=e.split("."),i=t.length;i<=2||t[i-1],this.querySelector("div").insertAdjacentHTML("beforeend",`<asset-file asset-name="${e}"></asset-file>`)}getFolder(e){let t=e.split(".").length;t<=2||splitedFilename[t-1],this.querySelector("div").insertAdjacentHTML("beforeend",`<asset-folder asset-name="${e}"></asset-folder>`)}clearList(){this.querySelector("div").innerHTML=""}connectedCallback(){this.render()}}class x extends HTMLElement{constructor(){super(),this.classList.add("col-4","d-flex","flex-column","bd-highlight","overflow-hidden","mt-1","asset"),this.filename=this.getAttribute("asset-name"),this.directory=document.querySelector("asset-list").nowDirectory}render(){const e=this.template();this.innerHTML=e}template(){return`<span class="material-symbols-outlined icon-lg align-self-center"> draft </span>\n        <b class="align-self-center text-ellipsis-scroll text-light text-center">${this.filename}</b>`}handleClick(){this.patchToControl(`${this.directory}/${this.filename}`,`${this.directory}`)}patchToControl(e,t){fetch(`file://${e}`).then((e=>e.blob())).then((t=>{let i=URL.createObjectURL(t),s=t.type.split("/")[0],n=document.querySelector("element-control");"image"==s?n.addImage(i,e):"video"==s&&n.addVideo(i,e)}))}connectedCallback(){this.render(),this.addEventListener("click",this.handleClick.bind(this))}disconnectedCallback(){this.removeEventListener("click",this.handleClick)}}class z extends HTMLElement{constructor(){super(),this.classList.add("col-4","d-flex","flex-column","bd-highlight","overflow-hidden","mt-1","asset"),this.foldername=this.getAttribute("asset-name"),this.directory=document.querySelector("asset-list").nowDirectory}render(){const e=this.template();this.innerHTML=e}template(){return`<span class="material-symbols-outlined icon-lg align-self-center"> folder </span>\n        <b class="align-self-center text-ellipsis text-light text-center">${this.foldername}</b>`}handleClick(){ipc.requestAllDir(`${this.directory}/${this.foldername}`)}connectedCallback(){this.render(),this.addEventListener("click",this.handleClick.bind(this))}disconnectedCallback(){this.removeEventListener("click",this.handleClick)}}class $ extends HTMLElement{constructor(){super(),this.directory=""}render(){const e=this.template();this.innerHTML=e}template(){return'<div class="row p-0 mt-2">\n        <div class="col-2">\n            <button class="btn btn-transparent btn-sm"><span class="material-symbols-outlined icon-sm"> arrow_upward </span> </button>\n        </div>\n        <div class="col-10">\n            <input type="text" class="form-control" aria-describedby="basic-addon1" value="" disabled>\n        </div>\n        </div>'}updateDirectoryInput(e){this.querySelector("div").querySelectorAll("div")[1].querySelector("input").value=e}clickPrevDirectoryButton(){this.directory=document.querySelector("asset-list").nowDirectory;let e=this.directory.split("/"),t=e.slice(-e.length,-1);ipc.requestAllDir(t.join("/"))}connectedCallback(){this.render(),this.querySelector("div").querySelectorAll("div")[0].querySelector("button").addEventListener("click",this.clickPrevDirectoryButton.bind(this))}disconnectedCallback(){this.querySelector("div").querySelectorAll("div")[0].querySelector("button").removeEventListener("click",this.clickPrevDirectoryButton)}}class T extends HTMLElement{constructor(){super(),this.timeline={}}render(){const e=this.template();this.classList.add("col-12","cursor-default","h-100","line"),this.innerHTML=e}template(){return'<div id="timeline_bar" class="timeline-bar" style="left: 0px;"></div>'}replaceTimelineBarHeight(e){this.querySelector(".timeline-bar").style.height=`${e}px`}getTimelineScrollHeight(){return this.scrollHeight}addElementBar(e){const t=this.templateElementBar(e);this.insertAdjacentHTML("beforeend",t);let i=this.getTimelineScrollHeight();this.replaceTimelineBarHeight(i)}templateElementBar(e){this.timeline[e].duration;let t=this.timeline[e].filetype,i=this.timeline[e].localpath.split("/"),s=(i[i.length-1],this.getElementType(t));return"static"==s?`<element-bar element-id="${e}" element-type="static"></element-bar>`:"dynamic"==s?`<element-bar element-id="${e}" element-type="dynamic"></element-bar>`:"none"}getElementType(e){let t="undefined";const i={static:["image","text","png","jpg","jpeg"],dynamic:["video","mp4","mp3","mov"]};for(const s in i)if(Object.hasOwnProperty.call(i,s)&&i[s].indexOf(e)>=0){t=s;break}return t}connectedCallback(){this.render()}}class E extends HTMLElement{constructor(){super(),this.timeline=document.querySelector("element-timeline").timeline,this.elementId=this.getAttribute("element-id"),this.elementBarType=this.getAttribute("element-type")||"static",this.width=this.timeline[this.elementId].duration,this.isDrag=!1,this.isResize=!1,this.resizeLocation="left",this.initialDuration=1e3,this.initialPosition={x:0,y:0};let e=this.timeline[this.elementId].localpath.split("/");this.filepath=e[e.length-1],this.resizeEventHandler}render(){let e;e="static"==this.elementBarType?this.templateStatic():this.templateDynamic();const t=this.getRandomColor();this.classList.add("element-bar","d-block"),this.setAttribute("style",`width: ${this.width}px; left: 0px; background-color: ${t};`),this.setAttribute("value",this.elementId),this.innerHTML=e}templateStatic(){return`\n        ${this.filepath}\n        <div class="element-bar-resize-left position-absolute" onmousedown="this.parentNode.resizeMousedown(this, 'left')"></div>\n        <div class="element-bar-resize-right position-absolute" onmousedown="this.parentNode.resizeMousedown(this, 'right')"></div>\n        `}templateDynamic(){return`\n        ${this.filepath}\n        <div class="element-bar-hiddenspace-left position-absolute">\n            <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="this.parentNode.parentNode.resizeRangeMousedown(this, 'left')">\n            </div>\n        </div>\n        <div class="element-bar-hiddenspace-right position-absolute">\n            <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="this.parentNode.parentNode.resizeRangeMousedown(this, 'right')">\n            </div>\n        </div>\n        `}getRandomArbitrary(e,t){return Math.round(Math.random()*(t-e)+e)}getRandomColor(){Math.round(16777215*Math.random()).toString(16);return`rgb(${this.getRandomArbitrary(45,167)},${this.getRandomArbitrary(23,139)},${this.getRandomArbitrary(56,180)})`}drag(e){if(this.isDrag){let t=e.pageX-this.initialPosition.x;e.pageY,this.initialPosition.y,this.style.left=`${t}px`,this.timeline[this.elementId].startTime=t}}dragMousedown(e){this.addEventListener("mousemove",this.drag),console.log("DRG"),this.isDrag=!0,this.initialPosition.x=e.pageX-Number(this.style.left.replace(/[^0-9]/g,"")),this.initialPosition.y=e.pageY}dragMouseup(){this.removeEventListener("mousemove",this.drag),this.isDrag=!1}resize(e){this.isDrag=!1;let t=e.pageX-this.initialPosition.x,i=(e.pageY,this.initialPosition.y,this.initialDuration),s=document.querySelector("element-timeline").scrollLeft;"left"==this.resizeLocation?(this.style.left=`${t}px`,this.style.width=i-t+"px",this.timeline[this.elementId].startTime=t,this.timeline[this.elementId].duration=Number(this.style.width.split("px")[0])):(this.style.width=s+e.pageX-Number(this.style.left.split("px")[0])+"px",this.timeline[this.elementId].duration=Number(this.style.width.split("px")[0]))}resizeRange(e){this.isDrag=!1;let t=e.pageX-this.initialPosition.x,i=this.initialDuration,s=Number(this.style.width.split("px")[0]),n=this.querySelector(".element-bar-hiddenspace-left"),l=this.querySelector(".element-bar-hiddenspace-right"),o=document.querySelector("element-timeline"),r=window.innerWidth,a=o.scrollWidth,d=Number(this.style.width.split("px")[0]),m=Number(this.style.left.split("px")[0]),c=r-s-m<0?a-(m+d):0,u=o.scrollLeft,h=a-r-u,p=r-s-m>0?r-s-m-10:0;"left"==this.resizeLocation?(n.style.width=this.initialPosition.x+t+u-m+"px",this.timeline[this.elementId].trim.startTime=Number(n.style.width.split("px")[0])):(l.style.width=h+r-t-this.initialPosition.x-p-c+"px",this.timeline[this.elementId].trim.endTime=i-Number(l.style.width.split("px")[0]))}resizeMousedown(e,t){console.log(this,Number(this.style.left.split("px")[0])),this.isResize=!0,this.resizeLocation=t,this.isDrag=!1,this.initialPosition.x="left"==t?e.pageX-Number(this.style.left.split("px")[0]):Number(this.style.left.split("px")[0]),this.initialPosition.y=e.pageY,this.initialDuration=this.timeline[this.elementId].duration+Number(this.style.left.replace(/[^0-9]/g,"")),this.resizeEventHandler=this.resize.bind(this),document.addEventListener("mousemove",this.resizeEventHandler)}resizeRangeMousedown(e,t){this.isResize=!0,this.resizeLocation=t,this.resizeRangeLeft=Number(this.querySelector(".element-bar-hiddenspace-left").style.width.split("px")[0]),this.resizeRangeRight=Number(this.querySelector(".element-bar-hiddenspace-right").style.width.split("px")[0]),this.isDrag=!1,this.initialPosition.x=Number(this.style.left.replace(/[^0-9]/g,"")),this.initialDuration=this.timeline[this.elementId].duration+Number(this.style.left.replace(/[^0-9]/g,"")),this.resizeEventHandler=this.resizeRange.bind(this),document.addEventListener("mousemove",this.resizeEventHandler)}resizeMouseup(){document.removeEventListener("mousemove",this.resizeEventHandler),this.isResize=!1}connectedCallback(){this.render(),this.addEventListener("mousedown",this.dragMousedown.bind(this)),this.addEventListener("mouseup",this.dragMouseup.bind(this)),document.addEventListener("mouseup",this.resizeMouseup.bind(this))}disconnectedCallback(){this.removeEventListener("mousedown",this.dragMousedown),this.removeEventListener("mouseup",this.dragMouseup)}}class S extends HTMLElement{constructor(){super(),this.scroller=void 0,this.isPaused=!0,this.progress=0,this.activeElementId="",this.previewRatio=1920/1080,this.resize()}resize(){let e=document.getElementById("split_col_2").offsetWidth,t=(document.getElementById("split_col_2").offsetHeight,.95*e),i=9*t/16;preview.width=t,preview.height=i,preview.style.width=`${t}px`,preview.style.height=`${i}px`,video.style.width=`${t}px`,video.style.height=`${i}px`,this.previewRatio=1920/t}addImage(e,t){const i=this.generateUUID(),s=document.querySelector("element-timeline");let n=document.createElement("img");n.src=e,n.onload=()=>{var l=n.width/10,o=n.height/10;s.timeline[i]={blob:e,startTime:0,duration:1e3,location:{x:0,y:0},width:l,height:o,localpath:t,filetype:"image"},this.showImage(i),s.addElementBar(i)}}addVideo(e,t){let i=document.createElement("video");const s=this.generateUUID(),n=document.querySelector("element-timeline");i.src=e,i.preload="metadata",i.onloadedmetadata=()=>{let l=i.videoWidth/10,o=i.videoHeight/10,r=200*i.duration;n.timeline[s]={blob:e,startTime:0,duration:r,location:{x:0,y:0},trim:{startTime:0,endTime:r},width:l,height:o,localpath:t,filetype:"video"},this.showVideo(s),n.addElementBar(s)}}addText(){const e=this.generateUUID(),t=document.querySelector("element-timeline");t.timeline[e]={startTime:0,duration:1e3,text:"텍스트",location:{x:0,y:0},localpath:"/TESTELEMENT",filetype:"text"},this.showText(e),t.addElementBar(e)}showImage(e){document.querySelector("element-timeline").timeline[e].blob,null==document.getElementById(`element-${e}`)?this.insertAdjacentHTML("beforeend",`<element-control-asset element-id="${e}" element-filetype="image"></element-control-asset>\n            `):document.querySelector(`#element-${e}`).classList.remove("d-none")}showVideo(e){const t=document.querySelector("element-timeline");if(null==document.getElementById(`element-${e}`)){this.insertAdjacentHTML("beforeend",`<element-control-asset element-id="${e}" element-filetype="video"></element-control-asset>`);let i=document.getElementById(`element-${e}`).querySelector("video"),s=(t.timeline[e].startTime-this.progress)/200;i.currentTime=s}else{let i=document.getElementById(`element-${e}`).querySelector("video"),s=-(t.timeline[e].startTime-this.progress)/200;i.currentTime>0&&!i.paused&&!i.ended&&i.readyState>2?(this.isPaused&&console.log("paused"),console.log("isPlaying")):(i.currentTime=s,i.play()),document.querySelector(`#element-${e}`).classList.remove("d-none")}}showText(e){null==document.getElementById(`element-${e}`)?this.insertAdjacentHTML("beforeend",`<element-control-asset element-id="${e}" element-filetype="text"></element-control-asset>\n            `):document.querySelector(`#element-${e}`).classList.remove("d-none")}changeText(e){const t=document.querySelector("element-timeline");let i=document.querySelector(`#element-${e}`).querySelector("input").value;console.log(e,i),t.timeline[e].text=i}progressToTime(){let e=5*this.progress;return new Date(e).toISOString().slice(11,22)}generateUUID(){return r()}hideElement(e){"video"==document.querySelector("element-timeline").timeline[e].filetype&&this.pauseVideo(e),document.querySelector(`#element-${e}`).classList.add("d-none")}play(){const e=document.querySelector("element-timeline").timeline,t=document.querySelector("element-timeline").querySelector("div"),i=document.querySelector("#time");let s=document.querySelector("#playToggle");s.setAttribute("onclick","elementControlComponent.stop()"),s.innerHTML='<span class="material-symbols-outlined icon-white icon-md"> stop_circle </span>',this.scroller=setInterval((()=>{let s=Number(t.style.left.split("px")[0])+4;this.progress=s,t.style.left=`${s}px`,i.innerHTML=this.progressToTime(),this.innerWidth+this.offsetWidth>=this.offsetWidth&&this.stop();for(let t in e){let i=e[t].filetype,s=e[t].startTime>this.progress||e[t].startTime+e[t].duration<this.progress;"video"==i&&(s=e[t].startTime+e[t].trim.startTime>this.progress||e[t].startTime+e[t].trim.endTime<this.progress),s?this.hideElement(t):"image"==i?this.showImage(t):"video"==i?this.showVideo(t):"text"==i&&this.showText(t)}}),20),this.isPaused=!1}stop(){clearInterval(this.scroller);const e=document.querySelector("#playToggle"),t=document.querySelector("#time");this.isPaused=!0,e.setAttribute("onclick","elementControlComponent.play()"),e.innerHTML='<span class="material-symbols-outlined icon-white icon-md"> play_circle </span>',t.innerHTML=this.progressToTime(),this.pauseAllVideo()}pauseVideo(e){document.getElementById(`element-${e}`).querySelector("video").pause()}pauseAllVideo(){const e=document.querySelector("element-timeline").timeline;let t;for(t in e)"video"==e[t].filetype&&document.getElementById(`element-${t}`).querySelector("video").pause()}reset(){const e=document.querySelector("#time"),t=document.querySelector("element-timeline").querySelector("div");this.progress=0,this.isPaused=!0,e.innerHTML=this.progressToTime(),t.style.left="0px"}}class L extends HTMLElement{constructor(){super(),this.timeline=document.querySelector("element-timeline").timeline,this.elementId=this.getAttribute("element-id"),this.elementFiletype=this.getAttribute("element-filetype")||"image",this.isDrag=!1,this.isResize=!1,this.initialPosition={x:0,y:0,w:0,h:0},this.resizeDirection="n",this.resizeEventHandler,this.dragdownEventHandler,this.dragupEventHandler}render(){let e;"image"==this.elementFiletype?e=this.templateImage()+this.templateResize():"video"==this.elementFiletype?e=this.templateVideo()+this.templateResize():"text"==this.elementFiletype&&(e=this.templateText()+this.templateResize()),this.classList.add("element-drag"),this.setAttribute("id",`element-${this.elementId}`),this.setAttribute("style",`width: ${this.timeline[this.elementId].width}px; height: ${this.timeline[this.elementId].height}px; top: 0px; left: 0px;`),this.innerHTML=e}templateImage(){return`\n        <img src="${this.timeline[this.elementId].blob}" alt="" class="element-image" draggable="false">`}templateVideo(){return`\n        <video src="${this.timeline[this.elementId].blob}" alt="" class="element-video" draggable="false"></video>`}templateText(){return`<input type="text" class="form-transparent element-text" draggable="false" onkeyup="document.querySelector('element-control').changeText('${this.elementId}')" value="텍스트">`}templateResize(){return'\n        <div class="resize-n" onmousedown="this.parentNode.resizeMousedown(\'n\')"></div>\n        <div class="resize-s" onmousedown="this.parentNode.resizeMousedown(\'s\')"></div>\n        <div class="resize-w" onmousedown="this.parentNode.resizeMousedown(\'w\')"></div>\n        <div class="resize-e" onmousedown="this.parentNode.resizeMousedown(\'e\')"></div>\n        <div class="resize-ne" onmousedown="this.parentNode.resizeMousedown(\'ne\')"></div>\n        <div class="resize-nw" onmousedown="this.parentNode.resizeMousedown(\'nw\')"></div>\n        <div class="resize-se" onmousedown="this.parentNode.resizeMousedown(\'se\')"></div>\n        <div class="resize-sw" onmousedown="this.parentNode.resizeMousedown(\'sw\')"></div>\n\n        '}pxToInteger(e="0px"){return Number(e.split("px")[0])}drag(e){if(this.isDrag){let t=e.clientX-this.initialPosition.x,i=e.clientY-this.initialPosition.y,s=["img","video","input"],n="";for(let e=0;e<s.length;e++)this.querySelector(s[e])&&(n=s[e]);t>window.innerWidth?document.removeEventListener("mousemove",this.dragdownEventHandler):(this.style.top=`${i}px`,this.style.left=`${t}px`,this.timeline[this.elementId].location.x=t,this.timeline[this.elementId].location.y=i)}}dragMousedown(e){this.isResize||(this.isDrag=!0,this.initialPosition.x=e.pageX-this.pxToInteger(this.style.left),this.initialPosition.y=e.pageY-this.pxToInteger(this.style.top),this.dragdownEventHandler=this.drag.bind(this),document.addEventListener("mousemove",this.dragdownEventHandler))}dragMouseup(){document.removeEventListener("mousemove",this.dragdownEventHandler),this.isDrag=!1}getGcd(e,t){return 0==t?e:this.getGcd(t,e%t)}resize(e){this.isDrag=!1;const t=document.querySelector("#video").getBoundingClientRect();let i=e.pageX-t.left-this.initialPosition.x,s=e.pageY-t.top-this.initialPosition.y;switch(this.initialPosition.w,this.initialPosition.h,this.resizeDirection){case"n":this.style.top=`${this.initialPosition.y+s}px`,this.style.height=this.initialPosition.h-s+"px";break;case"s":this.style.top=`${this.initialPosition.y}px`,this.style.height=`${s}px`;break;case"w":this.style.left=`${this.initialPosition.x+i}px`,this.style.width=this.initialPosition.w-i+"px";break;case"e":this.style.left=`${this.initialPosition.x}px`,this.style.width=`${i}px`;break;case"ne":this.style.top=`${this.initialPosition.y+s}px`,this.style.height=this.initialPosition.h-s+"px",this.style.width=`${i}px`;break;case"nw":this.style.top=`${this.initialPosition.y+s}px`,this.style.height=this.initialPosition.h-s+"px",this.style.left=`${this.initialPosition.x+i}px`,this.style.width=this.initialPosition.w-i+"px";break;case"sw":this.style.height=`${s}px`,this.style.left=`${this.initialPosition.x+i}px`,this.style.width=this.initialPosition.w-i+"px";break;case"se":this.style.top=`${this.initialPosition.y}px`,this.style.height=`${s}px`,this.style.left=`${this.initialPosition.x}px`,this.style.width=`${i}px`}this.timeline[this.elementId].location.y=Number(this.style.top.split("px")[0]),this.timeline[this.elementId].location.x=Number(this.style.left.split("px")[0]),this.timeline[this.elementId].width=Number(this.style.width.split("px")[0]),this.timeline[this.elementId].height=Number(this.style.height.split("px")[0])}resizeMousedown(e){this.isDrag=!1,this.isResize=!0,this.resizeDirection=e,this.initialPosition.w=Number(this.style.width.split("px")[0]),this.initialPosition.h=Number(this.style.height.split("px")[0]),this.initialPosition.x=Number(this.style.left.split("px")[0]),this.initialPosition.y=Number(this.style.top.split("px")[0]),this.resizeEventHandler=this.resize.bind(this),document.addEventListener("mousemove",this.resizeEventHandler)}resizeMouseup(){document.removeEventListener("mousemove",this.resizeEventHandler),this.isResize=!1}activateOutline(){const e=document.querySelector("element-control");this.deactivateAllOutline(),e.activeElementId=this.elementId,this.classList.add("element-outline")}deactivateAllOutline(){const e=document.querySelector("element-control"),t=document.querySelector("element-timeline");for(const e in t.timeline)Object.hasOwnProperty.call(t.timeline,e)&&document.querySelector(`#element-${e}`).classList.remove("element-outline");e.activeElementId=""}connectedCallback(){this.render(),this.addEventListener("mousedown",this.dragMousedown.bind(this)),this.addEventListener("mouseup",this.dragMouseup.bind(this)),this.addEventListener("mousedown",this.activateOutline.bind(this)),document.addEventListener("mouseup",this.resizeMouseup.bind(this))}}customElements.define("asset-list",w),customElements.define("asset-file",x),customElements.define("asset-folder",z),customElements.define("asset-browser",$),customElements.define("element-timeline",T),customElements.define("element-bar",E),customElements.define("element-control",S),customElements.define("element-control-asset",L),NUGGET=t})();