"use client"

import React, { useState, useEffect, useRef } from 'react';

const CameraAudioCapture: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

  const handleCapture = () => {
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

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-screen bg-gray-100">
      {hasPermission ? (
        <>
          <video ref={videoRef} autoPlay className="absolute top-0 left-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="relative z-10 flex flex-col items-center">
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
        </>
      ) : (
        <p>Requesting camera and microphone permissions...</p>
      )}
    </div>
  );
};

export default CameraAudioCapture;
