"use client"

import React, { useState, useEffect, useRef } from 'react';
import {
  genAI,
  fileToGenerativePart,
  displayTokenCount,
  streamToLog,
} from "./gemini.js";

const CameraAudioCapture: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest",
    generationConfig: {
      temperature: 0,
    },
  });

  useEffect(() => {
    async function getPermissions() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error('Error accessing media devices.', err);
      }
    }

    getPermissions();
  }, []);

  const handleCaptureOld = () => {
    // Capture photo
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // Start recording audio
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const imageToBase64 = () => {
    console.log('imageToBase64')
  
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Draw the current frame of the video onto the canvas
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
  
        // Get the base64 encoded data URL of the canvas content
        const dataURL = canvasRef.current.toDataURL('image/png');
        // setCapturedImage(dataURL);
  
        // Convert the data URL to a base64 buffer
        const base64Buffer = dataURL.split(',')[1];
        console.log(base64Buffer); // You can use this base64 buffer as needed
        return base64Buffer
      }
    }

  }

  const handleCapture = async () => {
    console.log('handleCapture')

    const base64Buffer = imageToBase64()

    const prompt =
      "Describe what you're seeing in a few sentences";
  
    // Note: The only accepted mime types are some image types, image/*.
    const imageParts = [
      {
        inlineData: {
          data: base64Buffer,
          mimeType: "image/png",
        }
      }
    ];
  
    displayTokenCount(model, [prompt, ...imageParts]);

    const result = await model.generateContentStream([prompt, ...imageParts]);
    streamToLog(result.stream);
    // Display the aggregated response
    const response = await result.response;
    // console.log(JSON.stringify(response, null, 2));
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-screen bg-gray-100">
      {hasPermission ? (
        <div className="">
          <video ref={videoRef} autoPlay className="absolute top-0 left-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-0 left-0 w-full p-4 text-white flex flex-col items-center">
            <audio ref={audioRef} controls className="mt-4" />
            <button
              onClick={handleCapture}
              disabled={isRecording}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Capture Photo & Start Recording
            </button>
            {/* {isRecording && (
              <button
                onClick={handleStopRecording}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
              >
                Stop Recording
              </button>
            )} */}
          </div>
        </div>
      ) : (
        <p>Requesting camera and microphone permissions...</p>
      )}
    </div>
  );
};

export default CameraAudioCapture;
