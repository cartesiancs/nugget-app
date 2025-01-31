import ffmpeg from "fluent-ffmpeg";

export const renderUtil = {
  getMediaMetadata: (mediaPath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(mediaPath, (err, metadata) => {
        resolve(metadata);
      });
    });
  },
  isExistAudio: (metadataStreams) => {
    let checkCodecType = "audio";
    return new Promise((resolve, reject) => {
      let isExist = false;
      metadataStreams.forEach((element) => {
        if (element.codec_type == checkCodecType) {
          isExist = true;
        }
      });

      resolve(isExist);
    });
  },
  convertMillisecondToHMS: (ms) => {
    let milliseconds: number = Math.floor((ms % 1000) / 100),
      seconds: number = Math.floor((ms / 1000) % 60),
      minutes: number = Math.floor((ms / (1000 * 60)) % 60),
      hours: number = Math.floor((ms / (1000 * 60 * 60)) % 24);

    let fillzeroHours = hours < 10 ? "0" + hours : hours;
    let fillzeroMinutes = minutes < 10 ? "0" + minutes : minutes;
    let fillzeroSeconds = seconds < 10 ? "0" + seconds : seconds;

    return (
      fillzeroHours +
      ":" +
      fillzeroMinutes +
      ":" +
      fillzeroSeconds +
      "." +
      milliseconds
    );
  },
  calculateEstimatedTime: (totalVideoTime) => {
    return totalVideoTime / 3;
  },
};
