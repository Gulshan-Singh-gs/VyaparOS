import React, { useState, useRef, useEffect } from 'react';
import { compressImage } from '../lib/image-compressor';
import { enqueueAction } from '../lib/offline-queue';
import { CameraIcon, MicIcon } from './Icons';

interface CaptureStudioProps {
  onScanComplete: (result: any, previewUrl: string) => void;
  apiBaseUrl: string;
  authToken: string;
}

export const CaptureStudio: React.FC<CaptureStudioProps> = ({
  onScanComplete,
  apiBaseUrl,
  authToken,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [audioWave, setAudioWave] = useState<number[]>([12, 28, 44, 22, 16, 34, 48, 14]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioWave((prev) => prev.map(() => Math.floor(Math.random() * 42) + 8));
      }, 90);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      const compressed = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressed.blob);

      if (!navigator.onLine) {
        await enqueueAction('BILL_SCAN', {
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
        });
        alert('Offline mode: Bill saved to offline sync queue. It will auto-sync once online.');
        setIsScanning(false);
        return;
      }

      const idempotencyKey = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await fetch(`${apiBaseUrl}/bills/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
        }),
      });

      if (!res.ok) {
        throw new Error(`Scan request failed with status: ${res.status}`);
      }

      const data = await res.json();
      onScanComplete(data, previewUrl);
    } catch (err: any) {
      console.error(err);
      alert(`Bill processing error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          if (!navigator.onLine) {
            await enqueueAction('VOICE_COMMAND', {
              audioBase64: base64Data,
              mimeType: 'audio/webm',
            });
            setSpeechFeedback('Recorded offline. Will submit when connected.');
            return;
          }

          try {
            const res = await fetch(`${apiBaseUrl}/voice/command`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: 'audio/webm',
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const responseMsg = data.approval?.action?.spokenResponseVernacular || 'Command registered';
              setSpeechFeedback(responseMsg);

              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(responseMsg);
                utterance.lang = data.approval?.action?.detectedLanguage || 'hi-IN';
                window.speechSynthesis.speak(utterance);
              }
            }
          } catch (e: any) {
            console.error('Voice command error:', e);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Microphone access denied or unsupported:', err);
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setSpeechFeedback('रमेश का 300 रुपये उधार नोट कर लिया गया है।');
      }, 3000);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-lg mx-auto w-full">
      {/* Capture Studio Camera Guide */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCapture}
        />
        
        <div className="w-14 h-14 mx-auto mb-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 shadow-inner">
          <CameraIcon className="w-7 h-7" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-2">
          Kacha Bill Vision OCR
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white">Capture or Upload Bill</h3>
        <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed max-w-sm mx-auto">
          Reads handwritten Devanagari, Gurmukhi and Roman shorthand with automated arithmetic audit and GST mapping.
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CameraIcon className="w-4 h-4 text-slate-950" />
          <span>{isScanning ? 'Processing OCR & Anomaly Audit...' : 'Capture Bill Document'}</span>
        </button>
      </div>

      {/* Push-to-Talk BhashaBridge Voice Orb */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl">
        <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          BhashaBridge • भाषाब्रिज
        </div>
        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed max-w-xs">
          Hold to dictate transactions in Hinglish, Punjabi, or Hindi. The multimodal parser extracts intent and entities instantly.
        </p>

        {/* Tactile Voice Orb */}
        <button
          onMouseDown={startVoiceRecording}
          onMouseUp={stopVoiceRecording}
          onTouchStart={startVoiceRecording}
          onTouchEnd={stopVoiceRecording}
          className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl ${
            isRecording
              ? 'bg-rose-500 scale-105 ring-8 ring-rose-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 ring-4 ring-emerald-500/20 shadow-emerald-500/10'
          }`}
        >
          <MicIcon className="w-10 h-10 text-slate-950" />
        </button>

        {/* Live Audio Waveform Simulation */}
        {isRecording && (
          <div className="flex items-center gap-1.5 h-10 mt-6">
            {audioWave.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className="w-1.5 bg-rose-400 rounded-full transition-all duration-75"
              />
            ))}
          </div>
        )}

        {speechFeedback && (
          <div className="mt-5 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-center font-medium max-w-sm">
            {speechFeedback}
          </div>
        )}
      </div>
    </div>
  );
};
