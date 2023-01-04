import React, { useState, useEffect } from "react";
import "./App.css";

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [encoded, setEncoded] = useState();
  const [duration, setDuration] = useState(0);

  const load = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    load();
  }, []);

  const encodeToSize = async () => {
    // Write the file to memory
    ffmpeg.FS("writeFile", "inputFile.mp4", await fetchFile(video));

    // const vf = 0.5; // 2x
    // const af = 2.0; // 2x

    const videoFast = () => {
      if (duration <= 300) {
        return 0.2;  // 5x
      } else {
        return 0.1; // 10x
      }
    }

    const audioFast = () => {
      if (duration <= 300) {
        return 5;  // 5x
      } else {
        return 10; // 10x
      }
    }

    // Run the FFMpeg command
    await ffmpeg.run(
      "-i",
      "inputFile.mp4",
      "-preset",
      "ultrafast",
      // "-t",
      // "5", // fragment duration second
      "-ss",
      "0.0",
      "-filter_complex",
      `[0:v]setpts=${videoFast()}*PTS[v];[0:a]atempo=${audioFast()}[a]`,
      "-map",
      "[v]",
      "-map",
      "[a]",
      "-deadline",
      "realtime",
      "-cpu-used",
      "8",
      "-f",
      "mp4",

      "encoded.mp4"
    );

    // Read the result
    const data = ffmpeg.FS("readFile", "encoded.mp4");

    // Create a URL
    const url = URL.createObjectURL(
      new Blob([data.buffer], { type: "video/mp4" })
    );
    setEncoded(url);
    console.log("duration", duration);
  };

  return ready ? (
    <div className="App">

      {video && (
        <video controls width="250" src={URL.createObjectURL(video)}
        onLoadedMetadata={e => {
          setDuration(e.target.duration)
        }}></video>
      )}

      <input type="file" onChange={(e) => setVideo(e.target.files?.item(0))} />

      <h3>Result</h3>

      <button onClick={encodeToSize}>Convert</button>

      {encoded && (
        <video controls width="720">
          <source src={encoded} type="video/mp4" />
        </video>
      )}
    </div>
  ) : (
    <p>Loading...</p>
  );
}

export default App;
