var ffmpeg = require("fluent-ffmpeg");
var command = ffmpeg();

const getVideoInfo = (inputPath) => {
  return new Promise((resolve, reject) => {
    return ffmpeg.ffprobe(inputPath, (error, videoInfo) => {
      if (error) {
        return reject(error);
      }

      const { duration, size } = videoInfo.format;

      return resolve({
        size,
        durationInSeconds: Math.floor(duration),
      });
    });
  });
};

const getRandomIntegerInRange = (min, max) => {
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);

  return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt);
};

const getStartTimeInSeconds = (
  videoDurationInSeconds,
  fragmentDurationInSeconds
) => {
  // by subtracting the fragment duration we can be sure that the resulting
  // start time + fragment duration will be less than the video duration
  const safeVideoDurationInSeconds =
    videoDurationInSeconds - fragmentDurationInSeconds;

  // if the fragment duration is longer than the video duration
  if (safeVideoDurationInSeconds <= 0) {
    return 0;
  }

  return getRandomIntegerInRange(
    0.25 * safeVideoDurationInSeconds,
    0.75 * safeVideoDurationInSeconds
  );
};

export const createFragmentPreview = async (
  inputPath,
  outputPath,
  fragmentDurationInSeconds = 4
) => {
  return new Promise(async (resolve, reject) => {
    const { durationInSeconds: videoDurationInSeconds } = await getVideoInfo(
      inputPath
    );

    const startTimeInSeconds = getStartTimeInSeconds(
      videoDurationInSeconds,
      fragmentDurationInSeconds
    );

    return ffmpeg()
      .input(inputPath)
      .inputOptions([`-ss ${startTimeInSeconds}`])
      .outputOptions([`-t ${fragmentDurationInSeconds}`])
      .audioFilter("atempo=2.0")
      .videoFilters('setpts=0.5*PTS')
      .output(outputPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

// https://api.video.wiki/media/temporary/2023/01/03/85f4638f-e499-495d-aacf-544520fc30b4.webm
// example1.mp4

createFragmentPreview("./example1.mp4","out1.mp4",6);
