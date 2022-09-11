var nugget;(()=>{"use strict";var e={d:(t,n)=>{for(var i in n)e.o(n,i)&&!e.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:n[i]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{asset:()=>h,canvas:()=>v,element:()=>p});const n={randomUUID:"undefined"!=typeof crypto&&crypto.randomUUID&&crypto.randomUUID.bind(crypto)};let i;const o=new Uint8Array(16);function s(){if(!i&&(i="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto),!i))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return i(o)}const r=[];for(let e=0;e<256;++e)r.push((e+256).toString(16).slice(1));const l=function(e,t,i){if(n.randomUUID&&!t&&!e)return n.randomUUID();const o=(e=e||{}).random||(e.rng||s)();if(o[6]=15&o[6]|64,o[8]=63&o[8]|128,t){i=i||0;for(let e=0;e<16;++e)t[i+e]=o[e];return t}return function(e,t=0){return(r[e[t+0]]+r[e[t+1]]+r[e[t+2]]+r[e[t+3]]+"-"+r[e[t+4]]+r[e[t+5]]+"-"+r[e[t+6]]+r[e[t+7]]+"-"+r[e[t+8]]+r[e[t+9]]+"-"+r[e[t+10]]+r[e[t+11]]+r[e[t+12]]+r[e[t+13]]+r[e[t+14]]+r[e[t+15]]).toLowerCase()}(o)},a={},d={},u={scroller:void 0,isPaused:!0,progress:split_inner_bottom.scrollLeft,start:function(){let e=document.querySelector("#playToggle");e.setAttribute("onclick","nugget.element.player.stop()"),e.innerHTML='<i class="fas fa-pause text-light"></i>',u.scroller=setInterval((function(){let e=Number(timeline_bar.style.left.split("px")[0])+4;timeline_bar.style.left=`${e}px`,u.progress=e,split_inner_bottom.innerWidth+split_inner_bottom.offsetWidth>=split_inner_bottom.offsetWidth&&u.stop(),g.play()}),20),u.isPaused=!1},stop:function(){clearInterval(u.scroller),u.isPaused=!0;let e=document.querySelector("#playToggle");e.setAttribute("onclick","nugget.element.player.start()"),e.innerHTML='<i class="fas fa-play text-light"></i>',g.pauseAllVideo()},reset:function(){timeline_bar.style.left="0px",u.progress=0,u.isPaused=!0}},c={state:{isDrag:!1,isResize:!1,resizeLocation:"left",resizeRangeLeft:0,resizeRangeRight:0,e:void 0,blob:"",elementId:"",criteria:{x:0,y:0,duration:1e3},criteriaResize:{x:0,y:0}},event:{drag:{onmousedown:function(e){c.state.elementId=e.getAttribute("value"),c.state.isDrag=!0,c.state.e=e,c.state.criteria.x=valueEvent.mouse.x-Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.criteria.y=valueEvent.mouse.y},onmouseup:function(e){c.state.isDrag=!1}},resize:{onmousedownrange:function(e,t="left"){c.state.e=e.parentNode.parentNode,c.state.elementId=c.state.e.getAttribute("value"),c.state.isResize=!0,c.state.resizeLocation=t,c.state.isDrag=!1,c.state.criteria.duration=a[c.state.elementId].duration+Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.criteriaResize.x=Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.resizeRangeLeft=Number(c.state.e.querySelector(".element-bar-hiddenspace-left").style.width.split("px")[0]),c.state.resizeRangeRight=Number(c.state.e.querySelector(".element-bar-hiddenspace-right").style.width.split("px")[0])},onmousedown:function(e,t="left"){c.state.elementId=e.parentNode.getAttribute("value"),c.state.isResize=!0,c.state.resizeLocation=t,c.state.isDrag=!1,c.state.e=e.parentNode,c.state.criteriaResize.x="left"==t?valueEvent.mouse.x-Number(c.state.e.style.left.replace(/[^0-9]/g,"")):Number(c.state.e.style.left.replace(/[^0-9]/g,"")),c.state.criteriaResize.y=valueEvent.mouse.y,c.state.criteria.duration=a[c.state.elementId].duration+Number(c.state.e.style.left.replace(/[^0-9]/g,""))},onmouseup:function(e){c.state.isResize=!1}}},append:function(e){let t,n=document.querySelector("#split_inner_bottom"),i=a[e].duration,o=a[e].filetype,s=a[e].localpath.split("/"),r=s[s.length-1],l=c.getRandomColor();"video"==o&&(t=`<div class="element-bar" style="width: ${i}px; left: 0px; background-color: ${l};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${e}">\n            ${r}\n            <div class="element-bar-hiddenspace-left position-absolute">\n                <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'left')">\n                </div>\n            </div>\n            <div class="element-bar-hiddenspace-right position-absolute">\n                <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'right')">\n                </div>\n            </div>\n            </div>`);let d="video"!=o?`<div class="element-bar" style="width: ${i}px; left: 0px; background-color: ${l};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${e}">\n            ${r}\n            <div class="element-bar-resize-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'left')"></div>\n            <div class="element-bar-resize-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'right')"></div>\n            </div>`:t;n.insertAdjacentHTML("beforeend",d)},drag:function(e,t){let n=c.state.elementId;c.state.e.style.left=`${e}px`,a[n].startTime=e},resizeDurationInTimeline:function(e,t="left"){let n=c.state.elementId,i=c.state.criteria.duration;"left"==t?(c.state.e.style.left=`${e}px`,c.state.e.style.width=i-e+"px",a[n].startTime=e,a[n].duration=Number(c.state.e.style.width.split("px")[0])):(c.state.e.style.left=`${c.state.criteriaResize.x}px`,c.state.e.style.width=split_inner_bottom.scrollLeft+valueEvent.mouse.x-c.state.criteriaResize.x+"px",a[n].startTime=c.state.criteriaResize.x,a[n].duration=Number(c.state.e.style.width.split("px")[0]))},resizeRangeOnElement:function(e,t="left"){let n=c.state.elementId,i=c.state.criteria.duration,o=(c.state.resizeRangeLeft,c.state.resizeRangeRight,c.state.e.querySelector(".element-bar-hiddenspace-left")),s=c.state.e.querySelector(".element-bar-hiddenspace-right");"left"==t?(o.style.width=e+split_inner_bottom.scrollLeft-5+"px",a[n].trim.startTime=Number(o.style.width.split("px")[0])):(s.style.width=window.innerWidth-e-c.state.criteriaResize.x+"px",a[n].trim.endTime=i-Number(s.style.width.split("px")[0]))},getRandomColor:function(){return"#"+Math.round(16777215*Math.random()).toString(16)+"51"}},m={state:{isDrag:!1,isResize:!1,e:void 0,elementId:"",criteriaDrag:{x:0,y:0},criteriaResize:{x:0,y:0,w:0,h:0},resizeDirection:"",resizeTargetElementId:""},event:{drag:{onmousedown:function(e){m.state.isDrag=!0,m.state.e=e,m.state.criteriaDrag.x=valueEvent.mouse.x-Number(m.state.e.style.left.replace(/[^0-9]/g,"")),m.state.criteriaDrag.y=valueEvent.mouse.y-Number(m.state.e.style.top.replace(/[^0-9]/g,""))},onmouseup:function(e){m.state.isDrag=!1}},resize:{onmousedown:function(e,t="n"){let n=document.querySelector(`#element-${e}`);m.state.isDrag=!1,m.state.criteriaResize.w=Number(n.style.width.split("px")[0]),m.state.criteriaResize.h=Number(n.style.height.split("px")[0]),m.state.criteriaResize.x=Number(n.style.left.split("px")[0]),m.state.criteriaResize.y=Number(n.style.top.split("px")[0]),m.state.isResize=!0,m.state.resizeTargetElementId=e,m.state.resizeDirection=t}},textinput:{onkeyup:function(e){let t=document.querySelector(`#element-${e}`).querySelector("input").value;console.log(e,t),a[e].text=t}}},add:{image:function(e,t){let n=document.createElement("img"),i=m.generateUUID();n.src=e,n.onload=function(){var o=n.width/10,s=n.height/10;a[i]={startTime:0,duration:1e3,location:{x:0,y:0},width:o,height:s,localpath:t,filetype:"image"},d[i]={blob:e},g.show.image(i),c.append(i)}},video:function(e,t){let n=document.createElement("video"),i=m.generateUUID();n.src=e,n.preload="metadata",n.onloadedmetadata=function(){let o=n.videoWidth/10,s=n.videoHeight/10,r=200*n.duration;a[i]={startTime:0,duration:r,location:{x:0,y:0},trim:{startTime:0,endTime:r},width:o,height:s,localpath:t,filetype:"video"},d[i]={blob:e},g.show.video(i),c.append(i)}},text:function(){let e=m.generateUUID();a[e]={startTime:0,duration:1e3,text:"",location:{x:0,y:0},localpath:"/TESTELEMENT",filetype:"text"},g.show.text(e),c.append(e)}},drag:function(e,t){let n=m.state.e,i=["img","video","input"],o="";for(let e=0;e<i.length;e++)n.querySelector(i[e])&&(o=i[e]);let s=n.querySelector(o).parentNode.getAttribute("id").split("element-")[1];n.style.top=`${t}px`,n.style.left=`${e}px`,a[s].location.x=e,a[s].location.y=t},dragover:function(e){e.stopPropagation(),e.preventDefault()},drop:function(e){e.stopPropagation(),e.preventDefault()},onmouseup:function(e){m.state.isResize=!1,m.state.isDrag=!1;for(const e in a)Object.hasOwnProperty.call(a,e)&&document.querySelector(`#element-${e}`)},generateUUID:function(){return l()},resize:{action:function(e,t){m.state.isDrag=!1;let n=m.state.resizeTargetElementId,i=document.querySelector(`#element-${n}`);switch(m.state.resizeDirection){case"n":i.style.top=`${m.state.criteriaResize.y+t}px`,i.style.height=m.state.criteriaResize.h-t+"px";break;case"s":i.style.top=`${m.state.criteriaResize.y}px`,i.style.height=`${t}px`;break;case"w":i.style.left=`${m.state.criteriaResize.x+e}px`,i.style.width=m.state.criteriaResize.w-e+"px";break;case"e":i.style.left=`${m.state.criteriaResize.x}px`,i.style.width=`${e}px`}a[n].location.y=Number(i.style.top.split("px")[0]),a[n].location.x=Number(i.style.left.split("px")[0]),a[n].width=Number(i.style.width.split("px")[0]),a[n].height=Number(i.style.height.split("px")[0])}}},g={previewRatio:1920/preview.width,show:{image:function(e){let t=d[e].blob;null==document.getElementById(`element-${e}`)?control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='width: ${a[e].width}px; height: ${a[e].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">\n                <img src="${t}" alt="" class="element-image" draggable="false">\n                <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'e')"></div>\n    \n                </div>\n                `):document.querySelector(`#element-${e}`).classList.remove("d-none")},video:function(e){let t=d[e].blob;if(null==document.getElementById(`element-${e}`)){control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='width: ${a[e].width}px; height: ${a[e].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">\n                <video src="${t}" alt="" class="element-video" draggable="false"></video>\n                <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'e')"></div>\n    \n                </div>\n                `);let n=document.getElementById(`element-${e}`).querySelector("video"),i=(a[e].startTime-u.progress)/200;n.currentTime=i}else{let t=document.getElementById(`element-${e}`).querySelector("video"),n=-(a[e].startTime-u.progress)/200;t.currentTime>0&&!t.paused&&!t.ended&&t.readyState>2?(u.isPaused&&console.log("paused"),console.log("isPlaying")):(t.currentTime=n,t.play()),document.querySelector(`#element-${e}`).classList.remove("d-none")}},text:function(e){null==document.getElementById(`element-${e}`)?control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">\n                <input type="text" class="form-transparent element-text" draggable="false" onkeyup="nugget.element.control.event.textinput.onkeyup('${e}')">\n                <div class="resize-n" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.event.resize.onmousedown('${e}', 'e')"></div>\n    \n                </div>\n                `):document.querySelector(`#element-${e}`).classList.remove("d-none")}},hide:function(e){"video"==a[e].filetype&&g.pauseVideo(e),document.querySelector(`#element-${e}`).classList.add("d-none")},play:function(){let e;for(e in a){location.origin,d[e];let t=a[e].filetype,n=a[e].startTime>u.progress||a[e].startTime+a[e].duration<u.progress;"video"==t&&(n=a[e].startTime+a[e].trim.startTime>u.progress||a[e].startTime+a[e].trim.endTime<u.progress),n?g.hide(e):g.show[t](e)}},pauseVideo:function(e){document.getElementById(`element-${e}`).querySelector("video").pause()},pauseAllVideo:function(){let e;for(e in a)"video"==a[e].filetype&&document.getElementById(`element-${e}`).querySelector("video").pause()}},p={timeline:a,player:u,bar:c,control:m,preview:g},f={mediaRecorder:void 0,resize:function(){let e=document.getElementById("split_col_2").offsetWidth,t=(document.getElementById("split_col_2").offsetHeight,.95*e),n=9*t/16;preview.width=t,preview.height=n,preview.style.width=`${t}px`,preview.style.height=`${n}px`,video.style.width=`${t}px`,video.style.height=`${n}px`,nugget.element.preview.previewRatio=1920/t},render:function(e){let t,n=e.getContext("2d");for(t in preview.clear(),nugget.element.timeline){let e=`blob:${location.origin}/${t}`;if(nugget.element.timeline[t].startTime>nugget.element.player.progress||nugget.element.timeline[t].startTime+nugget.element.timeline[t].duration<nugget.element.player.progress);else{let i=new Image;i.src=e,n.drawImage(i,nugget.element.timeline[t].location.x,nugget.element.timeline[t].location.y,nugget.element.timeline[t].width,nugget.element.timeline[t].height)}}let i=document.getElementById("split_inner_bottom");i.scrollWidth-i.offsetWidth<=nugget.element.player.progress+1&&null!=f.mediaRecorder&&f.mediaRecorder.stop()},clear:function(e){preview.width=preview.width},export:function(){let e=[];return new Promise((function(t,n){let i=preview.captureStream(60);f.mediaRecorder=new MediaRecorder(i,{mimeType:"video/webm; codecs=vp9"}),f.mediaRecorder.start(0),f.mediaRecorder.ondataavailable=function(t){e.push(event.data)},f.mediaRecorder.onstop=function(n){let i=new Blob(e,{type:"video/webm"}),o=URL.createObjectURL(i);t({url:o,blobVideo:i}),exportVideo.src=o,exportVideoModal.show()},nugget.element.player.start(),f.render()}))}},v={preview:f},y={nowDirectory:"",loadFile:function(e,t){let n=e.split("."),i=n.length;i<=2||n[i-1],document.querySelector("#assetBrowser").insertAdjacentHTML("beforeend",`\n            <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="nugget.asset.add('${t}/${e}', '${t}')">\n                <i class="fas fa-file icon-lg align-self-center"></i>\n                <b class="align-self-center text-ellipsis-scroll text-light text-center">${e}</b> \n            </div>`)},loadFolder:function(e,t){document.querySelector("#assetBrowser").insertAdjacentHTML("beforeend",`\n            <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="ipc.requestAllDir('${t}/${e}')">\n                <i class="fas fa-folder icon-lg align-self-center"></i>\n                <b class="align-self-center text-ellipsis text-light text-center">${e}</b>\n            </div>`)},loadPrevDirectory:function(){let e=y.nowDirectory.split("/"),t=e.slice(-e.length,-1);ipc.requestAllDir(t.join("/"))},add:function(e,t){fetch(`file://${e}`).then((e=>e.blob())).then((t=>{let n=URL.createObjectURL(t),i=t.type.split("/")[0];nugget.element.control.add[i](n,e)}))}},h=y;nugget=t})();