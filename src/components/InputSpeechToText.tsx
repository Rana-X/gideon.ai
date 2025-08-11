'use client'

import { useState, useRef, useEffect } from 'react';

// useSpeechToText.tsx Part
export interface SpeechToTextOptions {
    onTranscriptionUpdate: (text: string) => void;
    model?: 'whisper-large-v3' | 'whisper-large-v3-turbo';
    chunkDuration?: number; // seconds
}

export const useSpeechToText = ({
    onTranscriptionUpdate,
    model = 'whisper-large-v3-turbo',
    chunkDuration = 3
}: SpeechToTextOptions) => {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    // State
    const [isRecording, setIsRecording] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs for audio processing
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Float32Array[]>([]);
    const isRecordingRef = useRef(false);

    // * ADDED: Ref to hold the latest onTranscriptionUpdate callback *
    const onTranscriptionUpdateRef = useRef(onTranscriptionUpdate);

    // Effect to keep isRecordingRef in sync with isRecording state
    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    // * ADDED: Effect to update the onTranscriptionUpdateRef when the prop changes *
    useEffect(() => {
        onTranscriptionUpdateRef.current = onTranscriptionUpdate;
    }, [onTranscriptionUpdate]);

    // Audio processing functions
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

    const processAudioChunk = async (chunksToProcess: Float32Array[]) => {
        if (chunksToProcess.length === 0) {
            console.log('Skipping chunk: no data to process.');
            return;
        }
        if (!apiKey) {
            console.error('Skipping chunk: API key is not available.');
            setError('API key not configured.');
            return;
        }

        try {
            const totalLength = chunksToProcess.reduce((sum, chunk) => sum + chunk.length, 0);
            const combinedAudio = new Float32Array(totalLength);
            let offset = 0;

            for (const chunk of chunksToProcess) {
                combinedAudio.set(chunk, offset);
                offset += chunk.length;
            }

            const audioBlob = float32ArrayToWav(combinedAudio, 16000);

            const formData = new FormData();
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', model);
            formData.append('response_format', 'json');
            formData.append('temperature', '0');

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}` },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                if (result.text && result.text.trim()) {
                    const cleanText = result.text.trim();
                    // * MODIFIED: Use the ref to call the latest callback *
                    if (onTranscriptionUpdateRef.current) {
                        onTranscriptionUpdateRef.current(cleanText);
                    }
                }
            } else {
                const errorBody = await response.text();
                console.error(`API Error: ${response.status}`, errorBody);
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }
        } catch (err) {
            console.error('Error processing audio chunk:', err);
            setError(err instanceof Error ? err.message : 'Transcription failed');
        }
    };

    const startRecording = async () => {
        if (isRecordingRef.current) return;

        try {
            setError(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            streamRef.current = stream;

            const AudioContextClass = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
                                       (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass({
                    sampleRate: 16000
                } as AudioContextOptions);
            }
            if (!audioContextRef.current) {
                throw new Error('AudioContext could not be created');
            }

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            let bufferCount = 0;
            const buffersPerChunk = Math.max(1, Math.floor((chunkDuration * 16000) / 4096));

            processorRef.current.onaudioprocess = (event) => {
                if (!isRecordingRef.current) {
                    return;
                }
                const inputBuffer = event.inputBuffer.getChannelData(0);
                audioChunksRef.current.push(new Float32Array(inputBuffer));
                bufferCount++;

                if (bufferCount >= buffersPerChunk) {
                    const chunksToProcess = [...audioChunksRef.current];
                    audioChunksRef.current = [];
                    bufferCount = 0;
                    processAudioChunk(chunksToProcess);
                }
            };

            if (sourceRef.current && processorRef.current && audioContextRef.current) {
                sourceRef.current.connect(processorRef.current);
                processorRef.current.connect(audioContextRef.current.destination);
            }

            isRecordingRef.current = true;
            setIsRecording(true);
            setIsStreaming(true);

        } catch (err) {
            console.error('Error starting recording:', err);
            const errorMessage = err instanceof Error ? err.message : 'Could not access microphone or start audio processing.';
            setError(errorMessage);
            isRecordingRef.current = false;
            setIsRecording(false);
            setIsStreaming(false);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                await audioContextRef.current.close().catch(e => console.error("Cleanup error in startRecording:", e));
                audioContextRef.current = null;
            }
        }
    };

    const stopRecording = async () => {
        if (!isRecordingRef.current && !isStreaming) {
            console.log("Stop recording: Already stopped or not active.");
            return;
        }

        const wasRecording = isRecordingRef.current;
        isRecordingRef.current = false;

        if (wasRecording) {
            setIsRecording(false);
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("MediaStreamTrack stopped");
            });
            streamRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
            console.log("ScriptProcessorNode disconnected and handler removed");
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
            console.log("MediaStreamAudioSourceNode disconnected");
        }

        const remainingChunks = [...audioChunksRef.current];
        audioChunksRef.current = [];

        console.log(`Processing ${remainingChunks.length} remaining audio chunks.`);

        try {
            if (remainingChunks.length > 0) {
                await processAudioChunk(remainingChunks);
                console.log("Final audio chunk processed.");
            }
        } catch (err) {
            console.error('Error processing final audio chunk during stopRecording:', err);
            setError(err instanceof Error ? err.message : 'Failed to process final audio');
        } finally {
            if (audioContextRef.current) {
                if (audioContextRef.current.state !== 'closed') {
                    try {
                        await audioContextRef.current.close();
                        console.log("AudioContext closed.");
                    } catch (closeErr) {
                        console.error('Error closing AudioContext:', closeErr);
                    }
                }
                audioContextRef.current = null;
            }
            setIsStreaming(false);
            console.log("Streaming set to false. Stop recording complete.");
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const clearError = () => setError(null);

    useEffect(() => {
        const localStreamRef = streamRef;
        const localAudioContextRef = audioContextRef;
        const localProcessorRef = processorRef;
        const localSourceRef = sourceRef;
        const localIsRecordingRef = isRecordingRef;

        return () => {
            localIsRecordingRef.current = false;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            if (localProcessorRef.current) {
                localProcessorRef.current.disconnect();
                localProcessorRef.current.onaudioprocess = null;
                localProcessorRef.current = null;
            }
            if (localSourceRef.current) {
                localSourceRef.current.disconnect();
                localSourceRef.current = null;
            }
            if (localAudioContextRef.current && localAudioContextRef.current.state !== 'closed') {
                localAudioContextRef.current.close().catch(e => console.error("Error closing AudioContext on unmount:", e));
                localAudioContextRef.current = null;
            }
        };
    }, []);

    return {
        isRecording,
        isStreaming,
        error,
        toggleRecording,
        clearError
    };
};

// MicrophoneButton.tsx Part
export interface MicrophoneButtonProps {
    isRecording: boolean;
    isStreaming: boolean;
    error: string | null;
    onClick: () => void;
    disabled?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export default function MicrophoneButton({
    isRecording,
    isStreaming,
    error,
    onClick,
    disabled = false,
    size = 'medium',
    className = ''
}: MicrophoneButtonProps) {

    const sizeClasses = {
        small: 'h-8 w-8',
        medium: 'h-10 w-10',
        large: 'h-12 w-12'
    };

    const iconSizes = {
        small: 14,
        medium: 16,
        large: 20
    };

    const getButtonState = () => {
        if (error) return 'error';
        if (isRecording) return 'recording';
        if (isStreaming) return 'streaming';
        return 'idle';
    };

    const getButtonStyles = () => {
        const state = getButtonState();
        const baseClasses = `${sizeClasses[size]} flex items-center justify-center rounded-lg transition-all sketch-border-light`;

        switch (state) {
            case 'recording':
                return `${baseClasses} bg-red-600 hover:bg-red-500 text-white animate-pulse`;
            case 'streaming':
                return `${baseClasses} bg-yellow-600 text-white cursor-not-allowed`;
            case 'error':
                return `${baseClasses} bg-red-700 text-white cursor-not-allowed`;
            default:
                return disabled
                    ? `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`
                    : `${baseClasses} bg-white hover:bg-gray-100 text-black hover:scale-110`;
        }
    };

    const getTooltipText = () => {
        if (error) return `Error: ${error}`;
        if (isStreaming) return 'Transcribing...';
        if (isRecording) return 'Stop Recording';
        return 'Voice Input';
    };

    const renderIcon = () => {
        const iconSize = iconSizes[size];

        if (isStreaming) {
            return (
                <div
                    className="border-2 border-white border-t-transparent rounded-full animate-spin"
                    style={{ width: iconSize, height: iconSize }}
                />
            );
        }

        if (isRecording) {
            return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                    <rect x="8" y="8" width="8" height="8" rx="1" />
                </svg>
            );
        }

        return (
            <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
        );
    };

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={onClick}
                disabled={disabled || (isStreaming && !isRecording)}
                className={`${getButtonStyles()} ${className}`}
                aria-label={getTooltipText()}
            >
                {renderIcon()}
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {getTooltipText()}
            </div>
        </div>
    );
}
