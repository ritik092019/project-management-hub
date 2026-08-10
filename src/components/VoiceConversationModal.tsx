import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  AlertCircle, 
  MessageSquare,
  Square,
  Activity
} from 'lucide-react';

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Audio queue management for smooth 24kHz audio playback
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      startLiveVoiceSession();
    } else {
      stopLiveVoiceSession();
    }

    return () => {
      stopLiveVoiceSession();
    };
  }, [isOpen]);

  // Convert Float32Array from web audio mic to 16kHz 16-bit PCM Base64 string
  const pcm16ToBase64 = (float32Array: Float32Array): string => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Convert 24kHz Base64 PCM output from Gemini Live API to Float32Array
  const base64ToFloat32PCM = (base64: string): Float32Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const dataView = new DataView(bytes.buffer);
    const samples = new Float32Array(bytes.length / 2);
    for (let i = 0; i < samples.length; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      samples[i] = int16 / (int16 < 0 ? 32768 : 32767);
    }
    return samples;
  };

  // Queue audio chunk for gapless playback
  const queueAudioChunk = (base64Audio: string) => {
    try {
      const pcmData = base64ToFloat32PCM(base64Audio);
      audioQueueRef.current.push(pcmData);
      if (!isPlayingRef.current) {
        processAudioQueue();
      }
    } catch (err) {
      console.error('Error queuing audio chunk:', err);
    }
  };

  const processAudioQueue = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    if (!outputAudioCtxRef.current) {
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = outputAudioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const pcmChunk = audioQueueRef.current.shift();
    if (!pcmChunk) return;

    const audioBuffer = ctx.createBuffer(1, pcmChunk.length, 24000);
    audioBuffer.getChannelData(0).set(pcmChunk);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (nextStartTimeRef.current < currentTime) {
      nextStartTimeRef.current = currentTime;
    }

    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;

    source.onended = () => {
      processAudioQueue();
    };
  };

  const stopAudioPlayback = () => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
  };

  const startLiveVoiceSession = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // 1. Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 2. Setup Input Audio Context at 16,000 Hz
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      // 3. Connect WebSocket to backend server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // Start processing mic audio stream
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(inputCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMuted) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const base64PCM = pcm16ToBase64(inputData);

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'audio', audio: base64PCM }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'audio' && data.audio) {
            queueAudioChunk(data.audio);
            if (data.text) {
              setLastTranscript(prev => prev + ' ' + data.text);
            }
          }

          if (data.type === 'interrupted') {
            stopAudioPlayback();
          }

          if (data.type === 'error') {
            setErrorMessage(data.message || 'Gemini Live Session Error');
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Live Error:', err);
        setErrorMessage('Failed to connect to Live Voice Server WebSocket');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };

    } catch (err: any) {
      console.error('Mic or Live API initialization error:', err);
      setErrorMessage(err.message || 'Unable to access microphone or connect to Gemini Live session.');
      setIsConnecting(false);
    }
  };

  const stopLiveVoiceSession = () => {
    stopAudioPlayback();

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close();
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Header Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Status Badge */}
          <div className="mb-6 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              gemini-3.1-flash-live-preview
            </span>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-white mb-2">Real-Time Voice Conversation</h2>
          <p className="text-xs text-slate-400 max-w-xs mb-8">
            Speak naturally with Gemini Live API. Ask questions about software architecture, test coverage, or project updates.
          </p>

          {/* Central Pulsing Visualizer Orb */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            {/* Animated Rings when connected / speaking */}
            {isConnected && (
              <>
                <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 opacity-20 blur-xl animate-ping ${isSpeaking ? 'scale-125 duration-75' : ''}`} />
                <div className={`absolute inset-2 rounded-full border-2 border-cyan-500/40 ${isSpeaking ? 'animate-spin' : ''}`} />
                <div className={`absolute inset-6 rounded-full border border-blue-500/30 ${isSpeaking ? 'scale-110 transition-transform' : ''}`} />
              </>
            )}

            {/* Core Orb Button */}
            <div
              className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative z-10 ${
                isConnecting
                  ? 'bg-slate-800 border-2 border-amber-500/50 text-amber-400'
                  : isConnected
                  ? isSpeaking
                    ? 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 text-white shadow-cyan-500/30 scale-105'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-blue-600/30'
                  : 'bg-slate-800 border-2 border-red-500/50 text-red-400'
              }`}
            >
              {isConnecting ? (
                <Activity className="w-10 h-10 animate-spin text-amber-400" />
              ) : isConnected ? (
                isSpeaking ? (
                  <Volume2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Mic className="w-10 h-10 text-white animate-pulse" />
                )
              ) : (
                <MicOff className="w-10 h-10 text-slate-500" />
              )}
            </div>
          </div>

          {/* Connection Status Text */}
          <div className="mb-6">
            {isConnecting && (
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" /> Initializing Live Voice Session...
              </span>
            )}
            {isConnected && !isSpeaking && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Listening... Speak into microphone
              </span>
            )}
            {isConnected && isSpeaking && (
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" /> Gemini is speaking...
              </span>
            )}
            {!isConnected && !isConnecting && (
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Session Disconnected
              </span>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="w-full mb-6 p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Transcript Preview */}
          {lastTranscript && (
            <div className="w-full mb-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-20 overflow-y-auto text-left italic">
              "{lastTranscript}"
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              disabled={!isConnected}
              className={`p-3 rounded-xl border font-medium text-xs flex items-center gap-2 transition-all cursor-pointer ${
                isMuted
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
            </button>

            {isSpeaking && (
              <button
                type="button"
                onClick={stopAudioPlayback}
                className="p-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 text-red-400 fill-current" />
                <span>Interrupt AI</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (isConnected) {
                  stopLiveVoiceSession();
                } else {
                  startLiveVoiceSession();
                }
              }}
              className={`p-3 rounded-xl border font-medium text-xs transition-all cursor-pointer ${
                isConnected
                  ? 'bg-red-950/40 border-red-500/40 text-red-300 hover:bg-red-900/60'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
              }`}
            >
              {isConnected ? 'End Session' : 'Reconnect'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
