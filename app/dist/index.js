var nugget;(()=>{"use strict";var e={d:(t,i)=>{for(var n in i)e.o(i,n)&&!e.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:i[n]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{asset:()=>v,canvas:()=>y,element:()=>g});const i={randomUUID:"undefined"!=typeof crypto&&crypto.randomUUID&&crypto.randomUUID.bind(crypto)};let n;const s=new Uint8Array(16);function r(){if(!n&&(n="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto),!n))throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return n(s)}const o=[];for(let e=0;e<256;++e)o.push((e+256).toString(16).slice(1));const l=function(e,t,n){if(i.randomUUID&&!t&&!e)return i.randomUUID();const s=(e=e||{}).random||(e.rng||r)();if(s[6]=15&s[6]|64,s[8]=63&s[8]|128,t){n=n||0;for(let e=0;e<16;++e)t[n+e]=s[e];return t}return function(e,t=0){return(o[e[t+0]]+o[e[t+1]]+o[e[t+2]]+o[e[t+3]]+"-"+o[e[t+4]]+o[e[t+5]]+"-"+o[e[t+6]]+o[e[t+7]]+"-"+o[e[t+8]]+o[e[t+9]]+"-"+o[e[t+10]]+o[e[t+11]]+o[e[t+12]]+o[e[t+13]]+o[e[t+14]]+o[e[t+15]]).toLowerCase()}(s)},a={},d={},c={scroller:void 0,isPaused:!0,progress:split_inner_bottom.scrollLeft,start:function(){let e=document.querySelector("#playToggle");e.setAttribute("onclick","nugget.element.player.stop()"),e.innerHTML='<i class="fas fa-pause text-light"></i>',c.scroller=setInterval((function(){let e=Number(timeline_bar.style.left.split("px")[0])+4;timeline_bar.style.left=`${e}px`,c.progress=e,split_inner_bottom.innerWidth+split_inner_bottom.offsetWidth>=split_inner_bottom.offsetWidth&&c.stop(),p.play()}),20),c.isPaused=!1},stop:function(){clearInterval(c.scroller),c.isPaused=!0;let e=document.querySelector("#playToggle");e.setAttribute("onclick","nugget.element.player.start()"),e.innerHTML='<i class="fas fa-play text-light"></i>',p.pauseAllVideo()},reset:function(){timeline_bar.style.left="0px",c.progress=0,c.isPaused=!0}},u={state:{isDrag:!1,isResize:!1,resizeLocation:"left",resizeRangeLeft:0,resizeRangeRight:0,e:void 0,blob:"",elementId:"",criteria:{x:0,y:0,duration:1e3},criteriaResize:{x:0,y:0}},event:{drag:{onmousedown:function(e){u.state.elementId=e.getAttribute("value"),u.state.isDrag=!0,u.state.e=e,u.state.criteria.x=valueEvent.mouse.x-Number(u.state.e.style.left.replace(/[^0-9]/g,"")),u.state.criteria.y=valueEvent.mouse.y},onmouseup:function(e){u.state.isDrag=!1}},resize:{onmousedownrange:function(e,t="left"){u.state.e=e.parentNode.parentNode,u.state.elementId=u.state.e.getAttribute("value"),u.state.isResize=!0,u.state.resizeLocation=t,u.state.isDrag=!1,u.state.criteria.duration=a[u.state.elementId].duration+Number(u.state.e.style.left.replace(/[^0-9]/g,"")),u.state.criteriaResize.x=Number(u.state.e.style.left.replace(/[^0-9]/g,"")),u.state.resizeRangeLeft=Number(u.state.e.querySelector(".element-bar-hiddenspace-left").style.width.split("px")[0]),u.state.resizeRangeRight=Number(u.state.e.querySelector(".element-bar-hiddenspace-right").style.width.split("px")[0])},onmousedown:function(e,t="left"){u.state.elementId=e.parentNode.getAttribute("value"),u.state.isResize=!0,u.state.resizeLocation=t,u.state.isDrag=!1,u.state.e=e.parentNode,u.state.criteriaResize.x="left"==t?valueEvent.mouse.x-Number(u.state.e.style.left.replace(/[^0-9]/g,"")):Number(u.state.e.style.left.replace(/[^0-9]/g,"")),u.state.criteriaResize.y=valueEvent.mouse.y,u.state.criteria.duration=a[u.state.elementId].duration+Number(u.state.e.style.left.replace(/[^0-9]/g,""))},onmouseup:function(e){u.state.isResize=!1}}},append:function(e){let t,i=document.querySelector("#split_inner_bottom"),n=a[e].duration,s=a[e].filetype,r=a[e].localpath.split("/"),o=r[r.length-1],l=u.getRandomColor();"video"==s&&(t=`<div class="element-bar" style="width: ${n}px; left: 0px; background-color: ${l};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${e}">\n            ${o}\n            <div class="element-bar-hiddenspace-left position-absolute">\n                <div class="element-bar-resize-hiddenspace-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'left')">\n                </div>\n            </div>\n            <div class="element-bar-hiddenspace-right position-absolute">\n                <div class="element-bar-resize-hiddenspace-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedownrange(this, 'right')">\n                </div>\n            </div>\n            </div>`);let d="video"!=s?`<div class="element-bar" style="width: ${n}px; left: 0px; background-color: ${l};" onmousedown="nugget.element.bar.event.drag.onmousedown(this)" value="${e}">\n            ${o}\n            <div class="element-bar-resize-left position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'left')"></div>\n            <div class="element-bar-resize-right position-absolute" onmousedown="nugget.element.bar.event.resize.onmousedown(this, 'right')"></div>\n            </div>`:t;i.insertAdjacentHTML("beforeend",d)},drag:function(e,t){let i=u.state.elementId;u.state.e.style.left=`${e}px`,a[i].startTime=e},resizeDurationInTimeline:function(e,t="left"){let i=u.state.elementId,n=u.state.criteria.duration;"left"==t?(u.state.e.style.left=`${e}px`,u.state.e.style.width=n-e+"px",a[i].startTime=e,a[i].duration=Number(u.state.e.style.width.split("px")[0])):(u.state.e.style.left=`${u.state.criteriaResize.x}px`,u.state.e.style.width=split_inner_bottom.scrollLeft+valueEvent.mouse.x-u.state.criteriaResize.x+"px",a[i].startTime=u.state.criteriaResize.x,a[i].duration=Number(u.state.e.style.width.split("px")[0]))},resizeRangeOnElement:function(e,t="left"){let i=u.state.elementId,n=u.state.criteria.duration,s=(u.state.resizeRangeLeft,u.state.resizeRangeRight,u.state.e.querySelector(".element-bar-hiddenspace-left")),r=u.state.e.querySelector(".element-bar-hiddenspace-right");"left"==t?(s.style.width=e+split_inner_bottom.scrollLeft-5+"px",a[i].trim.startTime=Number(s.style.width.split("px")[0])):(r.style.width=window.innerWidth-e-u.state.criteriaResize.x+"px",a[i].trim.endTime=n-Number(r.style.width.split("px")[0]))},getRandomColor:function(){return"#"+Math.round(16777215*Math.random()).toString(16)+"51"}},m={state:{isDrag:!1,isResize:!1,e:void 0,elementId:"",criteriaDrag:{x:0,y:0},criteriaResize:{x:0,y:0,w:0,h:0},resizeDirection:"",resizeTargetElementId:""},event:{drag:{onmousedown:function(e){m.state.isDrag=!0,m.state.e=e,m.state.criteriaDrag.x=valueEvent.mouse.x-Number(m.state.e.style.left.replace(/[^0-9]/g,"")),m.state.criteriaDrag.y=valueEvent.mouse.y-Number(m.state.e.style.top.replace(/[^0-9]/g,""))},onmouseup:function(e){m.state.isDrag=!1}}},upload:{image:function(e,t){let i=document.createElement("img"),n=m.generateUUID();i.src=e,i.onload=function(){var s=i.width/10,r=i.height/10;a[n]={startTime:0,duration:1e3,location:{x:0,y:0},width:s,height:r,localpath:t,filetype:"image"},d[n]={blob:e},p.show.image(n),u.append(n)}},video:function(e,t){let i=document.createElement("video"),n=m.generateUUID();i.src=e,i.preload="metadata",i.onloadedmetadata=function(){let s=i.videoWidth/10,r=i.videoHeight/10,o=200*i.duration;a[n]={startTime:0,duration:o,location:{x:0,y:0},trim:{startTime:0,endTime:o},width:s,height:r,localpath:t,filetype:"video"},d[n]={blob:e},p.show.video(n),u.append(n)}}},drag:function(e,t){let i=m.state.e,n=["img","video"],s="";for(let e=0;e<n.length;e++)i.querySelector(n[e])&&(s=n[e]);let r=i.querySelector(s).parentNode.getAttribute("id").split("element-")[1];i.style.top=`${t}px`,i.style.left=`${e}px`,a[r].location.x=e,a[r].location.y=t},dragover:function(e){e.stopPropagation(),e.preventDefault()},drop:function(e){e.stopPropagation(),e.preventDefault()},onmouseup:function(e){m.state.isResize=!1,m.state.isDrag=!1;for(const e in a)Object.hasOwnProperty.call(a,e)&&document.querySelector(`#element-${e}`)},generateUUID:function(){return l()},resize:{init:function(e,t="n"){let i=document.querySelector(`#element-${e}`);m.state.isDrag=!1,m.state.criteriaResize.w=Number(i.style.width.split("px")[0]),m.state.criteriaResize.h=Number(i.style.height.split("px")[0]),m.state.criteriaResize.x=Number(i.style.left.split("px")[0]),m.state.criteriaResize.y=Number(i.style.top.split("px")[0]),m.state.isResize=!0,m.state.resizeTargetElementId=e,m.state.resizeDirection=t},action:function(e,t){m.state.isDrag=!1;let i=m.state.resizeTargetElementId,n=document.querySelector(`#element-${i}`);switch(m.state.resizeDirection){case"n":n.style.top=`${m.state.criteriaResize.y+t}px`,n.style.height=m.state.criteriaResize.h-t+"px";break;case"s":n.style.top=`${m.state.criteriaResize.y}px`,n.style.height=`${t}px`;break;case"w":n.style.left=`${m.state.criteriaResize.x+e}px`,n.style.width=m.state.criteriaResize.w-e+"px";break;case"e":n.style.left=`${m.state.criteriaResize.x}px`,n.style.width=`${e}px`}a[i].location.y=Number(n.style.top.split("px")[0]),a[i].location.x=Number(n.style.left.split("px")[0]),a[i].width=Number(n.style.width.split("px")[0]),a[i].height=Number(n.style.height.split("px")[0])}}},p={previewRatio:1920/preview.width,show:{image:function(e){let t=d[e].blob;null==document.getElementById(`element-${e}`)?control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='width: ${a[e].width}px; height: ${a[e].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">\n                <img src="${t}" alt="" class="element-image" draggable="false">\n                <div class="resize-n" onmousedown="nugget.element.control.resize.init('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.resize.init('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.resize.init('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.resize.init('${e}', 'e')"></div>\n    \n                </div>\n                `):document.querySelector(`#element-${e}`).classList.remove("d-none")},video:function(e){let t=d[e].blob;if(null==document.getElementById(`element-${e}`)){control.insertAdjacentHTML("beforeend",`\n                <div id="element-${e}" class="element-drag" style='width: ${a[e].width}px; height: ${a[e].height}px; top: 0px; left: 0px;' onmousedown="nugget.element.control.event.drag.onmousedown(this)">\n                <video src="${t}" alt="" class="element-video" draggable="false"></video>\n                <div class="resize-n" onmousedown="nugget.element.control.resize.init('${e}', 'n')"></div>\n                <div class="resize-s" onmousedown="nugget.element.control.resize.init('${e}', 's')"></div>\n                <div class="resize-w" onmousedown="nugget.element.control.resize.init('${e}', 'w')"></div>\n                <div class="resize-e" onmousedown="nugget.element.control.resize.init('${e}', 'e')"></div>\n    \n                </div>\n                `);let i=document.getElementById(`element-${e}`).querySelector("video"),n=(a[e].startTime-c.progress)/200;i.currentTime=n}else{let t=document.getElementById(`element-${e}`).querySelector("video"),i=-(a[e].startTime-c.progress)/200;t.currentTime>0&&!t.paused&&!t.ended&&t.readyState>2?(c.isPaused&&console.log("paused"),console.log("isPlaying")):(t.currentTime=i,t.play()),document.querySelector(`#element-${e}`).classList.remove("d-none")}}},hide:function(e){"video"==a[e].filetype&&p.pauseVideo(e),document.querySelector(`#element-${e}`).classList.add("d-none")},play:function(){let e;for(e in a){location.origin,d[e];let t=a[e].filetype,i=a[e].startTime>c.progress||a[e].startTime+a[e].duration<c.progress;"video"==t&&(i=a[e].startTime+a[e].trim.startTime>c.progress||a[e].startTime+a[e].trim.endTime<c.progress),i?p.hide(e):p.show[t](e)}},pauseVideo:function(e){document.getElementById(`element-${e}`).querySelector("video").pause()},pauseAllVideo:function(){let e;for(e in a)"video"==a[e].filetype&&document.getElementById(`element-${e}`).querySelector("video").pause()}},g={timeline:a,player:c,bar:u,control:m,preview:p},f={mediaRecorder:void 0,resize:function(){let e=document.getElementById("split_col_2").offsetWidth,t=(document.getElementById("split_col_2").offsetHeight,.95*e),i=9*t/16;preview.width=t,preview.height=i,preview.style.width=`${t}px`,preview.style.height=`${i}px`,video.style.width=`${t}px`,video.style.height=`${i}px`,nugget.element.preview.previewRatio=1920/t},render:function(e){let t,i=e.getContext("2d");for(t in preview.clear(),nugget.element.timeline){let e=`blob:${location.origin}/${t}`;if(nugget.element.timeline[t].startTime>nugget.element.player.progress||nugget.element.timeline[t].startTime+nugget.element.timeline[t].duration<nugget.element.player.progress);else{let n=new Image;n.src=e,i.drawImage(n,nugget.element.timeline[t].location.x,nugget.element.timeline[t].location.y,nugget.element.timeline[t].width,nugget.element.timeline[t].height)}}let n=document.getElementById("split_inner_bottom");n.scrollWidth-n.offsetWidth<=nugget.element.player.progress+1&&null!=f.mediaRecorder&&f.mediaRecorder.stop()},clear:function(e){preview.width=preview.width},export:function(){let e=[];return new Promise((function(t,i){let n=preview.captureStream(60);f.mediaRecorder=new MediaRecorder(n,{mimeType:"video/webm; codecs=vp9"}),f.mediaRecorder.start(0),f.mediaRecorder.ondataavailable=function(t){e.push(event.data)},f.mediaRecorder.onstop=function(i){let n=new Blob(e,{type:"video/webm"}),s=URL.createObjectURL(n);t({url:s,blobVideo:n}),exportVideo.src=s,exportVideoModal.show()},nugget.element.player.start(),f.render()}))}},y={preview:f},h={nowDirectory:"",loadFile:function(e,t){let i=e.split("."),n=i.length;n<=2||i[n-1],document.querySelector("#assetBrowser").insertAdjacentHTML("beforeend",`\n            <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="nugget.asset.add('${t}/${e}', '${t}')">\n                <i class="fas fa-file icon-lg align-self-center"></i>\n                <b class="align-self-center text-ellipsis-scroll text-light text-center">${e}</b> \n            </div>`)},loadFolder:function(e,t){document.querySelector("#assetBrowser").insertAdjacentHTML("beforeend",`\n            <div class="col-4 d-flex flex-column bd-highlight overflow-hidden asset mt-1" onclick="ipc.requestAllDir('${t}/${e}')">\n                <i class="fas fa-folder icon-lg align-self-center"></i>\n                <b class="align-self-center text-ellipsis text-light text-center">${e}</b>\n            </div>`)},loadPrevDirectory:function(){let e=h.nowDirectory.split("/"),t=e.slice(-e.length,-1);ipc.requestAllDir(t.join("/"))},add:function(e,t){fetch(`file://${e}`).then((e=>e.blob())).then((t=>{let i=URL.createObjectURL(t),n=t.type.split("/")[0];nugget.element.control.upload[n](i,e)}))}},v=h;nugget=t})();