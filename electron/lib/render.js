import ffmpeg from 'fluent-ffmpeg'
import isDev from 'electron-is-dev'
import log from 'electron-log'
import fs from 'fs'

import config from '../config.json'

let resourcesPath = ''
let elementCounts = {
    video: 1,
    audio: 0
}
let mapAudioLists = []

if (isDev) {
  resourcesPath = '.'
  console.log('Running in development', isDev);

} else {
  if (process.platform == "darwin") {
    resourcesPath = process.resourcesPath
  } else if (process.platform == "win32") {
    resourcesPath = process.resourcesPath.split("\\").join("/")
  } else {
    resourcesPath = process.resourcesPath
  }
  
  console.log('Running in production');
}

const renderMain = {
    start: (evt, elements, options) => {
        const ffmpegPath = `${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffmpeg.filename}`
        const ffprobePath = `${resourcesPath}/bin/${config.ffmpegBin[process.platform].ffprobe.filename}`

        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath);

        log.info('Render starting...');

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
      
        command.complexFilter(filter, filterLists)
        command.outputOptions(['-map tmp?'])
        if (elementCounts.audio != 0) {

            

            mapAudioLists.forEach(element => {
                command.outputOptions([`-map ${element}`])
            });
          //command.outputOptions(['-map [audio]'])
        }
        command.output(options.videoDestination)
        command.audioCodec('aac')
        command.videoCodec('libx264')
        command.fps(50)
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
        })
      
        command.on('error', function(err, stdout, stderr) {
            log.info('Render Error', err.message);

            evt.sender.send('PROCESSING_ERROR', err.message)
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
        let milliseconds = Math.floor((ms % 1000) / 100),
            seconds = Math.floor((ms / 1000) % 60),
            minutes = Math.floor((ms / (1000 * 60)) % 60),
            hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    
        hours = (hours < 10) ? "0" + hours : hours;
        minutes = (minutes < 10) ? "0" + minutes : minutes;
        seconds = (seconds < 10) ? "0" + seconds : seconds;
    
        return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
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
          endTime: (object.element.startTime/1000) + (object.element.duration/1000)
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
            } else {
                object.command.input(object.element.localpath)
                    .inputOptions(`-ss ${trimStartHMS}`)
                    .inputOptions(`-itsoffset ${options.startTime}`)

                if (object.element.codec.video != "default") {
                  object.command.inputOptions(`-vcodec ${object.element.codec.video}`)

                }

            }

            options.startTime = options.startTime + (object.element.trim.startTime/1000)

        }

      
        if (isExistAudio == true) {
            mapAudioLists.push(`${elementCounts.video}:a`)
            elementCounts.audio += 1
        }
      
      
      
        object.filter.push({
          'filter': 'scale',
          'options': {
            'w': options.width,
            'h': options.height
          },
          'inputs': `[${elementCounts.video}:v]`,
          'outputs': `image${elementCounts.video}`
        })
      
        object.filter.push({
          'filter': 'overlay',
          'options': {
            'enable': `between(t,${options.startTime},${options.endTime})`,
            'x': `${Number(options.x)}`, // +((t-1)*85)
            'y': options.y
          },
          'inputs': `[tmp][image${elementCounts.video}]`,
          'outputs': `tmp`
        })
      
        elementCounts.video += 1
      },

    addFilterText: (object) => {
      let updateResourcesPath = process.platform == "win32" ? resourcesPath.substring(2) : resourcesPath
  
      let options = {
        text: object.element.text,
        textcolor: object.element.textcolor,
        fontsize: object.element.fontsize,
        fontfile: `${updateResourcesPath}/assets/fonts/notosanskr-medium.otf`,
        x: String(object.element.location.x),
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
          .audioCodec('copy')
          .audioChannels(2)
          .inputOptions(`-ss ${options.startTime}`)
          .inputOptions(`-itsoffset ${options.startTime}`)
          .seekInput(options.trim.start)
          .inputOptions(`-t ${options.duration}`)
        console.log(object.element.localpath, elementCounts.video)
      
      
      
      
        // object.filter.push({
        //   'filter': 'atrim',
        //   'options': {
        //     'start': options.startTime,
        //     'end': options.endTime
        //   },
        //   'inputs': elementCounts.video == 0 ? `[${elementCounts.video}:a]` : `[audio][${elementCounts.video}:a]`,
        //   'outputs': `audio`
        // })
      
        object.filter.push({
          'filter': 'amix',
          'options': {
      
            'inputs': elementCounts.audio == 0 ? 1 : 2,
            'duration': 'first',
            'dropout_transition': 0
          },
          'inputs': elementCounts.audio == 0 ? `[${elementCounts.video}:a]` : `[audio][${elementCounts.video}:a]`,
          'outputs': `audio`
        })
        
      
        elementCounts.audio += 1
        elementCounts.video += 1
      
    }
}

// exports.renderMain = renderMain
// exports.renderFilter = renderFilter

export { renderMain, renderFilter }