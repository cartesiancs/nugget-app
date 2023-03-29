import ffmpeg from 'fluent-ffmpeg'
import isDev from 'electron-is-dev'
import log from 'electron-log'
import fs from 'fs'
import { ffmpegConfig } from "./ffmpeg.js";

import config from '../config.json'

let resourcesPath = ''
let elementCounts = {
    video: 1,
    audio: 0
}
let mapAudioLists = []

if (isDev) {
  resourcesPath = '.'

} else {
  if (process.platform == "darwin") {
    resourcesPath = process.resourcesPath
  } else if (process.platform == "win32") {
    resourcesPath = process.resourcesPath.split("\\").join("/")
  } else {
    resourcesPath = process.resourcesPath
  }
  
}

const renderMain = {
    start: (evt, elements, options) => {
        const ffmpegPath = ffmpegConfig.FFMPEG_PATH
        const ffprobePath = ffmpegConfig.FFPROBE_PATH

        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath);

        log.info('[render] ===== Render starting... =====');
        if (isDev) {
          log.info("[render] ===== Render elements =====")
          log.info("elements:", JSON.stringify(elements))
        } 

        elementCounts.video = 1
        elementCounts.audio = 0
      
        let resizeRatio = options.previewRatio
        let mediaFileLists = ['image', 'video']
        let textFileLists = ['text']
        let audioFileLists = ['audio']
      
        let filter = []
        let command = ffmpeg()
        command.input(`${resourcesPath}/assets/images/background.png`).loop(options.videoDuration)
      
        filter.push({
          'filter': 'scale',
          'options': {
            'w': 1920,
            'h': 1080
          },
          'inputs': '[0:v]',
          'outputs': 'tmp'
        })
      
      
        for (const key in elements) {
          if (Object.hasOwnProperty.call(elements, key)) {
            const element = elements[key];
            //console.log(element)
      
            let isMedia = mediaFileLists.indexOf(element.filetype) >= 0;
            let isText = textFileLists.indexOf(element.filetype) >= 0;
            let isAudio = audioFileLists.indexOf(element.filetype) >= 0;
      
            if(isMedia)  {
              renderFilter.addFilterMedia({
                element: element,
                command: command,
                filter: filter,
                projectOptions: options
              })
            } else if (isText) {
              renderFilter.addFilterText({
                element: element,
                command: command,
                filter: filter,
                projectOptions: options
              })
            } else if (isAudio) {
              renderFilter.addFilterAudio({
                element: element,
                command: command,
                filter: filter,
                projectOptions: options
              })
            }
      
      
          }
        }

        evt.sender.send('PROCESSING', 0)

        let videoDurationMs = options.videoDuration*1000
        let estimatedTime = renderUtil.calculateEstimatedTime(videoDurationMs)
        let estimatedTimeDecrease = estimatedTime

        let estimatedTimeInterval = setInterval(() => {
            if (estimatedTimeDecrease <= 0) {
                estimatedTimeDecrease += 1000
            }
            estimatedTimeDecrease -= 500
            evt.sender.send('PROCESSING', (estimatedTime-estimatedTimeDecrease)/estimatedTime*100)
        }, 500);

      
        let filterLists = ['tmp']
      
        if (elementCounts.audio != 0) {

          //filterLists.push('audio')
        }
      

        if (elementCounts.audio != 0) {
          let inputsAudio = mapAudioLists.map(element => {
            return `[${element}]`
          }).join("")

          log.info("[render] Map Audio Lists", mapAudioLists)
          log.info("[render] Inputs Audio", inputsAudio)

          filterLists.push('audio')

          filter.push({
            'filter': 'amix',
            'options': {
        
              'inputs': mapAudioLists.length,
              'duration': 'longest',
              'dropout_transition': 0
            },
            'inputs': inputsAudio,
            'outputs': `audio`
          })


          //command.outputOptions(['-map [audio]'])
        }

        command.complexFilter(filter, filterLists)
        command.outputOptions(['-map tmp?'])

        command.output(options.videoDestination)
        command.audioCodec('aac')
        command.videoCodec('libx264')
        command.fps(60)
        command.videoBitrate(5500)
        command.format('mp4');
        command.run();


      
        //command.audioCodec('libmp3lame')
      
        // if (process.platform == 'darwin') {
      
        // } else if (process.platform == 'win32') {
        //   setTimeout(() => {
        //     command.on('progress', function(progress) {
        //       console.log('Processing: ' + progress.timemark + ' done');
        //       evt.sender.send('PROCESSING', progress.timemark)
        //     })
        //   }, 100);
        // }



      
        // command.on('progress', function(progress) {
        //   console.log('Processing: ' + progress.timemark + ' done');
        //   evt.sender.send('PROCESSING', progress.timemark)
        // })
      
      
      
        command.on('end', function() {
            clearInterval(estimatedTimeInterval)
            evt.sender.send('PROCESSING_FINISH')
            console.log('Finished processing');
            command.kill();
            mapAudioLists = []

        })
      
        command.on('error', function(err, stdout, stderr) {
            log.info('Render Error', err.message);
            evt.sender.send('PROCESSING_ERROR', err.message)
            process.crash();
            mapAudioLists = []
        });
    }
}


const renderUtil = {
    getMediaMetadata: (mediaPath) => {
        return new Promise((resolve, reject)=>{
            ffmpeg.ffprobe(mediaPath, (err, metadata) => {
                resolve(metadata)
            })
        })
    },
    isExistAudio: (metadataStreams) => {
        let checkCodecType = "audio"
        return new Promise((resolve, reject)=>{
            let isExist = false
            metadataStreams.forEach(element => {
                if (element.codec_type == checkCodecType) {
                    isExist = true
                }
            });

            resolve(isExist)
        })
    },
    convertMillisecondToHMS: (ms) => {
        let milliseconds: number = Math.floor((ms % 1000) / 100),
            seconds: number = Math.floor((ms / 1000) % 60),
            minutes: number = Math.floor((ms / (1000 * 60)) % 60),
            hours: number = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
        let fillzeroHours = (hours < 10) ? "0" + hours : hours;
        let fillzeroMinutes = (minutes < 10) ? "0" + minutes : minutes;
        let fillzeroSeconds = (seconds < 10) ? "0" + seconds : seconds;
    
        return fillzeroHours + ":" + fillzeroMinutes + ":" + fillzeroSeconds + "." + milliseconds;
    },
    calculateEstimatedTime: (totalVideoTime) => {
        return totalVideoTime/3
    }
}



const renderFilter = {
    addFilterMedia: (object) => {
        let staticFiletype = ['image']
        let dynamicFiletype = ['video']
        let checkStaticCondition = staticFiletype.indexOf(object.element.filetype) >= 0
        let checkDynamicCondition = dynamicFiletype.indexOf(object.element.filetype) >= 0
      
        let isExistAudio = object.element.isExistAudio

        // renderUtil.getMediaMetadata(object.element.localpath).then((mediaMetadata) => renderUtil.isExistAudio(mediaMetadata.streams).then((isExistAudio) => {
        //     return isExistAudio
        // }))
        


      
        let options = {
          width: String(object.element.width),
          height: String(object.element.height),
          x: String(object.element.location.x),
          y: String(object.element.location.y),
          startTime: object.element.startTime/1000,
          endTime: (object.element.startTime/1000) + (object.element.duration/1000),
          rotationRadian: object.element.rotation * Math.PI / 180,
          rotationDegree: object.element.rotation
        }

        if (checkStaticCondition) {
            object.command.input(object.element.localpath)
        }

        if (checkDynamicCondition) {
            //NOTE: 끝 부분 자르기 버그 있음
            //NOTE: 버그 지뢰임 나중에 해결해야

            let trimStartHMS = renderUtil.convertMillisecondToHMS(object.element.trim.startTime/1000)
            let trimDurationHMS = renderUtil.convertMillisecondToHMS((object.element.trim.endTime - object.element.trim.startTime)/1000)



            if (isExistAudio == true) {
                object.command.input(object.element.localpath)
                    .inputOptions(`-ss ${object.element.trim.startTime/1000}`)
                    .inputOptions(`-itsoffset ${options.startTime + object.element.trim.startTime/1000}`)
                    //.inputOptions(`-t ${(object.element.trim.endTime/1000) - (object.element.trim.startTime/1000)}`)

            } else {
                object.command.input(object.element.localpath)
                    .inputOptions(`-ss ${trimStartHMS}`)
                    .inputOptions(`-itsoffset ${options.startTime}`)
                    .inputOptions(`-t ${object.element.trim.endTime/1000}`)

                if (object.element.codec.video != "default") {
                  object.command.inputOptions(`-vcodec ${object.element.codec.video}`)

                }

            }

            options.startTime = options.startTime + (object.element.trim.startTime/1000)
            options.endTime = (object.element.startTime/1000) + object.element.trim.endTime/1000

        }

      
        // if (isExistAudio == true) {
        //   object.filter.push(`[${elementCounts.video}:a]adelay=${options.startTime * 1000}|${options.startTime * 1000}[audio${elementCounts.video}]`)

        //   mapAudioLists.push(`audio${elementCounts.video}`)
        //   //mapAudioLists.push(`${elementCounts.video}:a`)
        //   elementCounts.audio += 1
        // }
      

      
        object.filter.push({
          'filter': 'scale',
          'options': {
            'w': options.width,
            'h': options.height
          },
          'inputs': `[${elementCounts.video}:v]`,
          'outputs': `image${elementCounts.video}`
        })


        // NOTE: 회전시 사분면 사이드 잘림
        object.filter.push(`[image${elementCounts.video}]rotate=${options.rotationRadian}:c=none[image${elementCounts.video}]`)

        //:ow=rotw(${options.rotationRadian}):oh=roth(${options.rotationRadian})
      
        object.filter.push({
          'filter': 'overlay',
          'options': {
            'enable': `between(t,${options.startTime},${options.endTime})`,
            'x': `${Number(options.x)}`, // +((t-1)*85) + ${Math.min(0, options.height*Math.sin(options.rotationDegree))}
            'y': `${Number(options.y)}` //  + ${Math.min(0, options.width*Math.sin(options.rotationDegree))}
          },
          'inputs': `[tmp][image${elementCounts.video}]`,
          'outputs': `tmp`
        })
      
        elementCounts.video += 1

        if (isExistAudio == true) {
          renderFilter.addFilterAudio(object)
        }
      
      },

    addFilterText: (object) => {
      let updateResourcesPath = process.platform == "win32" ? resourcesPath.substring(2) : resourcesPath
      if (isDev) {
        updateResourcesPath = '.'
      }
      let fontPath = object.element.fontpath == 'default' ? `${updateResourcesPath}/assets/fonts/notosanskr-medium.otf` :  process.platform == "win32" ? object.element.fontpath.substring(2) : object.element.fontpath

      log.info("fontPath", fontPath)
  
      let options = {
        text: object.element.text,
        textcolor: object.element.textcolor,
        fontsize: object.element.fontsize,
        fontfile: fontPath,
        x: String(object.element.location.x + ((object.element.width - object.element.widthInner) / 2)),
        y: String(object.element.location.y),
        startTime: object.element.startTime/1000,
        endTime: (object.element.startTime/1000) + (object.element.duration/1000)
      }
      
      
      object.filter.push({
        'filter': 'drawtext',
        'options': {
          'enable': `between(t,${options.startTime},${options.endTime})`,
          'fontfile': options.fontfile,
          'text': options.text,
          'fontsize': options.fontsize,
          'fontcolor': options.textcolor,
          'x': options.x,
          'y': options.y
        },
        'inputs': `[tmp]`,
        'outputs': `tmp`
      })
    },


    addFilterAudio: (object) => {
        let options = {
          startTime: object.element.startTime/1000 + (object.element.trim.startTime/1000),
          trim: {
            start: object.element.trim.startTime/1000
          },
          duration: object.element.trim.endTime/1000 - (object.element.trim.startTime/1000),
          endTime: (object.element.startTime/1000) + (object.element.duration/1000)
        }
      
        object.command.input(object.element.localpath)
          .inputOptions(`-ss ${options.trim.start}`)
          //.inputOptions(`-itsoffset ${options.startTime}`)
          // .seekInput(options.trim.start)
          .inputOptions(`-t ${options.duration}`)
        log.info("[render] addFilterAudio ", object.element.localpath, elementCounts.video)
        log.info("[render] options.startTime ", options.startTime * 1000)

        object.filter.push(`[${elementCounts.video}:a]adelay=${options.startTime * 1000}|${options.startTime * 1000}[audio${elementCounts.video}]`)

        //mapAudioLists.push(`${elementCounts.video}:a`)
        mapAudioLists.push(`audio${elementCounts.video}`)

        
      
      
      
        // object.filter.push({
        //   'filter': 'atrim',
        //   'options': {
        //     'start': options.startTime,
        //     'end': options.endTime
        //   },
        //   'inputs': elementCounts.video == 0 ? `[${elementCounts.video}:a]` : `[audio][${elementCounts.video}:a]`,
        //   'outputs': `audio`
        // })
      

        
      
        elementCounts.audio += 1
        elementCounts.video += 1
      
    }
}

// exports.renderMain = renderMain
// exports.renderFilter = renderFilter

export { renderMain, renderFilter }