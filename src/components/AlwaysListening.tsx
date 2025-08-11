'use client'

import { useState, useEffect, useRef, useCallback } from 'react';

interface AlwaysListeningProps {
  onWakeWord: (word: string) => void;
  isActive: boolean;
}

export default function AlwaysListening({ onWakeWord, isActive }: AlwaysListeningProps) {
  const [isListening, setIsListening] = useState(false);
  const [lastDetected, setLastDetected] = useState('');
  const [showIndicator, setShowIndicator] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const float32ArrayToWav = (audioData: Float32Array, sampleRate: number): Blob => {
    const length = audioData.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // WAV header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const processAudioChunk = useCallback(async (chunks: Float32Array[]) => {
    if (!apiKey || chunks.length === 0 || isProcessingRef.current) return;

    // Wake words to listen for
    const WAKE_WORDS = ['morning', 'focus', 'relax', 'workout', 'coin', 'night', 'refresh'];

    isProcessingRef.current = true;

    try {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      const audioBlob = float32ArrayToWav(combinedAudio, 16000);

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');
      formData.append('temperature', '0');
      formData.append('language', 'en');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.text) {
          const text = result.text.toLowerCase().trim();
          console.log('Heard:', text);

          // Check for wake words
          for (const wakeWord of WAKE_WORDS) {
            if (text.includes(wakeWord)) {
              console.log(`🎯 Wake word detected: ${wakeWord}`);
              setLastDetected(wakeWord);
              setShowIndicator(true);
              setTimeout(() => setShowIndicator(false), 2000);
              onWakeWord(wakeWord);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [apiKey, onWakeWord]);

  const startListening = useCallback(async () => {
    if (!isActive || !apiKey) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const AudioContextClass = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
                                 (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      }

      if (!audioContextRef.current) return;

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      let bufferCount = 0;
      const buffersPerChunk = 8; // Process every ~2 seconds

      processorRef.current.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);

        // Simple voice activity detection
        const rms = Math.sqrt(inputBuffer.reduce((sum, val) => sum + val * val, 0) / inputBuffer.length);

        if (rms > 0.01) { // Voice detected
          audioChunksRef.current.push(new Float32Array(inputBuffer));
          bufferCount++;

          // Clear existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }

          // Process when we have enough audio
          if (bufferCount >= buffersPerChunk) {
            const chunksToProcess = [...audioChunksRef.current];
            audioChunksRef.current = [];
            bufferCount = 0;
            processAudioChunk(chunksToProcess);
          }

          // Set timeout for silence
          silenceTimeoutRef.current = setTimeout(() => {
            if (audioChunksRef.current.length > 0) {
              const chunksToProcess = [...audioChunksRef.current];
              audioChunksRef.current = [];
              bufferCount = 0;
              processAudioChunk(chunksToProcess);
            }
          }, 1000);
        }
      };

      if (sourceRef.current && processorRef.current && audioContextRef.current) {
        sourceRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
      }

      setIsListening(true);
      console.log('🎙️ Always listening mode activated');

    } catch (error) {
      console.error('Error starting always listening:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isActive, processAudioChunk]);

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    audioChunksRef.current = [];
    setIsListening(false);
    console.log('🔇 Stopped listening');
  }, []);

  // Start listening when component mounts and isActive
  useEffect(() => {
    if (isActive && !isListening) {
      startListening();
    } else if (!isActive && isListening) {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isActive, isListening, startListening, stopListening]);

  return (
    <>
      {/* Subtle listening indicator */}
      <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${isListening ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 sketch-border-light">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          <span className="text-xs font-bold">Listening...</span>
        </div>
      </div>

      {/* Wake word detected indicator */}
      {showIndicator && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-fade-in">
          <div className="px-6 py-4 bg-black text-white dark:bg-white dark:text-black sketch-border text-center">
            <p className="text-lg font-bold">✨ {lastDetected}</p>
            <p className="text-xs mt-1">Command activated</p>
          </div>
        </div>
      )}

      {/* Wake words help */}
      <div className="fixed bottom-4 right-4 z-40 group">
        <button className="p-2 text-xs opacity-50 hover:opacity-100 transition-opacity">
          <span className="font-bold">💬 Say: morning, focus, relax, workout, coin, night</span>
        </button>
      </div>
    </>
  );
}
