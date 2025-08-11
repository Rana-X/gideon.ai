'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSpeechToText } from './InputSpeechToText';

export interface VoiceCommand {
  patterns: string[];
  action: (params?: string) => void;
  description: string;
}

interface VoiceCommandsProps {
  commands: VoiceCommand[];
  onCommandDetected?: (command: string) => void;
  isActive: boolean;
}

export function useVoiceCommands({ commands, onCommandDetected, isActive }: VoiceCommandsProps) {
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  const processCommand = useCallback((text: string) => {
    const normalizedText = text.toLowerCase().trim();

    // Check each command pattern
    for (const command of commands) {
      for (const pattern of command.patterns) {
        if (normalizedText.includes(pattern.toLowerCase())) {
          // Extract parameters if needed
          const params = normalizedText.replace(pattern.toLowerCase(), '').trim();
          command.action(params || undefined);
          setLastCommand(pattern);
          onCommandDetected?.(pattern);
          return true;
        }
      }
    }
    return false;
  }, [commands, onCommandDetected]);

  const handleVoiceInput = useCallback((transcribedText: string) => {
    if (!isActive || !transcribedText.trim()) return;
    processCommand(transcribedText);
  }, [isActive, processCommand]);

  const speechToText = useSpeechToText({
    onTranscriptionUpdate: handleVoiceInput,
    chunkDuration: 2, // Shorter chunks for commands
  });

  const toggleListening = useCallback(() => {
    if (isActive) {
      speechToText.toggleRecording();
      setIsListening(!isListening);
    }
  }, [isActive, speechToText, isListening]);

  return {
    isListening: speechToText.isRecording,
    isProcessing: speechToText.isStreaming,
    error: speechToText.error,
    lastCommand,
    toggleListening,
  };
}

// Voice Command Button Component
interface VoiceCommandButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
}

export function VoiceCommandButton({
  isListening,
  isProcessing,
  onClick,
  className = ''
}: VoiceCommandButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed top-4 right-4 z-50 p-3 sketch-border transition-all ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-white hover:bg-gray-100'
      } ${className}`}
      style={{
        boxShadow: '3px 3px 0 0 #000',
        transform: isListening ? 'scale(1.1)' : 'scale(1)'
      }}
    >
      <div className="flex items-center gap-2">
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isListening ? 'animate-pulse' : ''}
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}
        <span className="text-sm font-bold">
          {isListening ? 'Listening...' : 'Voice Commands'}
        </span>
      </div>
    </button>
  );
}

// Command feedback toast
export function CommandFeedback({ command, show }: { command: string; show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in">
      <div className="sketch-border-light bg-white p-3 shadow-lg">
        <p className="text-sm font-bold">Command executed:</p>
        <p className="text-xs">{command}</p>
      </div>
    </div>
  );
}
