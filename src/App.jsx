import React, { useState, useEffect } from "react";
import "./App.css";

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
const ffmpeg = createFFmpeg({ log: true });

function App() {
  const [ready, setReady] = useState(false);
  const [video, setVideo] = useState();
  const [encoded, setEncoded] = useState();

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

    // Run the FFMpeg command
    await ffmpeg.run(
      "-i",
      "inputFile.mp4",
      "-preset",
      "ultrafast",
      "-t",
      "5", // fragment duration second
      "-ss",
      "10.0",
      "-filter_complex",
      "[0:v]setpts=0.5*PTS[v];[0:a]atempo=2.0[a]",
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
  };

  return ready ? (
    <div className="App">
      {video && (
        <video controls width="250" src={URL.createObjectURL(video)}></video>
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
