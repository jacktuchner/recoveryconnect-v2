"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob, durationSeconds: number, transcript?: string) => void;
  disabled?: boolean;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VideoRecorder({ onRecordingComplete, disabled }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const playbackRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      // Stop camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [recordedUrl]);

  // Start camera preview on mount
  useEffect(() => {
    if (!disabled && !recordedBlob) {
      startCameraPreview();
    }
    return () => {
      stopCameraPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, recordedBlob]);

  const startCameraPreview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setPermissionGranted(true);
      setCameraReady(true);
      setError(null);
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
      }
    } catch {
      setPermissionGranted(false);
      setCameraReady(false);
      setError("Camera/microphone permission denied. Please allow access to record video.");
    }
  }, []);

  const stopCameraPreview = useCallback(() => {
    if (streamRef.current && !isRecording) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    }
  }, [isRecording]);

  const startSpeechRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript;
        setTranscript(transcriptRef.current);
      }
      setIsTranscribing(interimTranscript.length > 0);
    };

    recognition.onerror = (event) => {
      console.log("Speech recognition error:", event);
    };

    recognition.onend = () => {
      if (mediaRecorderRef.current?.state === "recording") {
        try {
          recognition.start();
        } catch (e) {
          console.log("Could not restart speech recognition:", e);
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.log("Could not start speech recognition:", e);
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Error stopping speech recognition:", e);
      }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      transcriptRef.current = "";

      // Use existing stream or get a new one
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setPermissionGranted(true);
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
        }
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : "";

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);

        // Stop all tracks
        stream!.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setCameraReady(false);

        stopSpeechRecognition();
        setIsTranscribing(false);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();

      startSpeechRecognition();

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch {
      setPermissionGranted(false);
      setError("Failed to access camera/microphone. Please check your browser permissions.");
    }
  }, [startSpeechRecognition, stopSpeechRecognition]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopSpeechRecognition();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, stopSpeechRecognition]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      const pausedDuration = duration;
      startTimeRef.current = Date.now() - pausedDuration * 1000;
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  }, [isRecording, isPaused, duration]);

  const retryRecording = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setTranscript("");
    transcriptRef.current = "";
  }, [recordedUrl]);

  const confirmRecording = useCallback(() => {
    if (recordedBlob) {
      onRecordingComplete(recordedBlob, duration, transcript || undefined);
    }
  }, [recordedBlob, duration, transcript, onRecordingComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (disabled) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg text-center text-gray-500">
        Recording is disabled
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          {permissionGranted === false && (
            <button
              onClick={startCameraPreview}
              className="ml-2 text-red-800 underline hover:no-underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Recording / preview area */}
      {!recordedBlob ? (
        <div className="flex flex-col items-center space-y-4 p-6 bg-gray-50 rounded-lg">
          {/* Camera preview */}
          <div className="relative w-full max-w-lg aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!cameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                Starting camera...
              </div>
            )}

            {/* Recording indicator overlay */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/50 rounded-full px-3 py-1">
                <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"}`} />
                <span className="text-white text-sm font-mono">{formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Timer display (when not recording, show 0:00) */}
          {!isRecording && (
            <div className="text-4xl font-mono text-gray-700">
              {formatTime(duration)}
            </div>
          )}

          {/* Recording status */}
          {isRecording && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {isPaused ? "Paused" : "Recording..."}
              </span>
              {isTranscribing && (
                <span className="text-xs text-teal-600 animate-pulse">transcribing...</span>
              )}
            </div>
          )}

          {/* Live transcript preview */}
          {isRecording && transcript && (
            <div className="w-full max-w-md p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 max-h-24 overflow-y-auto">
              {transcript}
            </div>
          )}

          {/* Control buttons */}
          <div className="flex items-center space-x-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!cameraReady}
                className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-full transition-colors shadow-lg"
                title="Start recording"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" />
                </svg>
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                    title="Resume"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center justify-center w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
                    title="Pause"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center w-16 h-16 bg-gray-700 hover:bg-gray-800 text-white rounded-full transition-colors shadow-lg"
                  title="Stop recording"
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h12v12H6z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {!isRecording && cameraReady && (
            <p className="text-sm text-gray-500">Click the record button to start</p>
          )}
        </div>
      ) : (
        /* Playback and confirm */
        <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Recording duration: {formatTime(duration)}</span>
          </div>

          {/* Video player */}
          <div className="w-full max-w-lg mx-auto aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={playbackRef}
              src={recordedUrl || undefined}
              controls
              playsInline
              className="w-full h-full"
            />
          </div>

          {/* Transcript preview */}
          {transcript && (
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Transcript (auto-generated):</p>
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={retryRecording}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Record Again
            </button>
            <button
              onClick={confirmRecording}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Use This Recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
