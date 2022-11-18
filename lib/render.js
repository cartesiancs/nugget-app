const ffmpeg = require('fluent-ffmpeg');
const isDev = require('electron-is-dev');

const ffmpegPath = require('ffmpeg-static').replace(
    'app.asar',
    'app.asar.unpacked'
  );
ffmpeg.setFfmpegPath(ffmpegPath);

let resourcesPath = ''
let elementCounts = {
    video: 1,
    audio: 0
}

if (isDev) {
    resourcesPath = '.'
    console.log('Running in development', isDev);

} else {
    resourcesPath = process.resourcesPath
    console.log('Running in production');
}



const renderMain = {
    start: async (evt, elements, options) => {
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
                await renderFilter.addFilterMedia({
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


      
        filterLists = ['tmp']
      
        if (elementCounts.audio != 0) {
          filterLists.push('audio')
        }
      
        command.complexFilter(filter, filterLists)
        command.outputOptions(['-map tmp?'])
        if (elementCounts.audio != 0) {
          command.outputOptions(['-map audio?'])
        }
        command.output(options.videoDestination)
        command.audioCodec('aac')
        command.videoCodec('libx264')
        command.fps(50)
        command.format('mp4');
        command.run();
        evt.sender.send('PROCESSING', 0)

        let videoDurationMs = options.videoDuration*1000
        let estimatedTime = await renderUtil.calculateEstimatedTime(videoDurationMs)
        let estimatedTimeDecrease = estimatedTime

        let estimatedTimeInterval = setInterval(() => {
            if (estimatedTimeDecrease <= 0) {
                estimatedTimeDecrease += 1000
            }
            estimatedTimeDecrease -= 500
            evt.sender.send('PROCESSING', (estimatedTime-estimatedTimeDecrease)/estimatedTime*100)
        }, 500);
      
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
            evt.sender.send('PROCESSING_ERROR', err.message)
        });
    }
}


const renderUtil = {
    getMediaMetadata: async (mediaPath) => {
        return new Promise((resolve, reject)=>{
            ffmpeg.ffprobe(mediaPath, (err, metadata)=>{
                resolve(metadata)
            })
        })
    },
    isExistAudio: async (metadataStreams) => {
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
    calculateEstimatedTime: async (totalVideoTime) => {
        return totalVideoTime/3
    }
}



const renderFilter = {
    addFilterMedia: async (object) => {
        let staticFiletype = ['image']
        let dynamicFiletype = ['video']
        let checkStaticCondition = staticFiletype.indexOf(object.element.filetype) >= 0
        let checkDynamicCondition = dynamicFiletype.indexOf(object.element.filetype) >= 0
      
        object.command.input(object.element.localpath)

        let mediaMetadata = await renderUtil.getMediaMetadata(object.element.localpath)
        let isExistAudio = await renderUtil.isExistAudio(mediaMetadata.streams)
        console.log(isExistAudio)
        
      
        let options = {
          width: String(object.element.width),
          height: String(object.element.height),
          x: String(object.element.location.x),
          y: String(object.element.location.y),
          startTime: object.element.startTime/1000,
          endTime: (object.element.startTime/1000) + (object.element.duration/1000)
        }
      
        if (checkDynamicCondition && isExistAudio == true) {
          options.startTime = options.startTime + (object.element.trim.startTime/1000)
      
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
            'x': options.x,
            'y': options.y
          },
          'inputs': `[tmp][image${elementCounts.video}]`,
          'outputs': `tmp`
        })
      
        elementCounts.video += 1
      },

    addFilterText: (object) => {
  
        let options = {
          text: object.element.text,
          textcolor: object.element.textcolor,
          fontsize: object.element.fontsize,
          x: String(object.element.location.x),
          y: String(object.element.location.y),
          startTime: object.element.startTime/1000,
          endTime: (object.element.startTime/1000) + (object.element.duration/1000)
        }
      
      
        object.filter.push({
          'filter': 'drawtext',
          'options': {
            'enable': `between(t,${options.startTime},${options.endTime})`,
            'fontfile': `${resourcesPath}/assets/fonts/notosanskr-medium.otf`,
            'text': options.text,
            'fontsize': options.fontsize,
            'fontcolor': options.textcolor,
            'x': options.x,
            'y': options.y
          },
          'inputs': `tmp`,
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

exports.renderMain = renderMain
exports.renderFilter = renderFilter
