"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ThumbnailSelectorProps {
  videoBlob: Blob;
  onThumbnailSelected: (thumbnailBlob: Blob) => void;
  onBack: () => void;
}

export default function ThumbnailSelector({ videoBlob, onThumbnailSelected, onBack }: ThumbnailSelectorProps) {
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  // Create object URL for the video
  useEffect(() => {
    const url = URL.createObjectURL(videoBlob);
    videoUrlRef.current = url;
    if (videoRef.current) {
      videoRef.current.src = url;
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoBlob]);

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas dimensions to video's natural size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const dur = video.duration;
    setVideoDuration(dur);

    // Seek to 3 seconds or 0 if video is shorter
    const initialTime = Math.min(3, dur);
    video.currentTime = initialTime;
    setCurrentTime(initialTime);
  }, []);

  const handleSeeked = useCallback(() => {
    drawFrame();
    setIsReady(true);
  }, [drawFrame]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onThumbnailSelected(blob);
        }
      },
      "image/jpeg",
      0.85
    );
  }, [onThumbnailSelected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${tenths}`;
  };

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Choose a Thumbnail</h3>
      <p className="text-sm text-gray-500">
        Scrub through your video to find the perfect frame for your thumbnail.
      </p>

      {/* Hidden video element for frame extraction */}
      <video
        ref={videoRef}
        onLoadedMetadata={handleLoadedMetadata}
        onSeeked={handleSeeked}
        className="hidden"
        playsInline
        muted
        preload="auto"
      />

      {/* Canvas preview */}
      <div className="w-full max-w-lg mx-auto">
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Loading video...
            </div>
          )}
        </div>
      </div>

      {/* Scrub slider */}
      {videoDuration > 0 && (
        <div className="w-full max-w-lg mx-auto space-y-2">
          <input
            type="range"
            min={0}
            max={videoDuration}
            step={0.1}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(videoDuration)}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isReady}
          className="px-5 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Use This Frame
        </button>
      </div>
    </div>
  );
}
