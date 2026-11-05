import React, { useState, useEffect, useRef } from 'react';
import { formatRupees, paiseToRupees } from '@vyapar-os/shared';
import { MicIcon, SparklesIcon, CheckIcon, CloseIcon } from '../Icons';

interface VoiceAssistantViewProps {
  onExecuteVoiceMutation: (action: {
    intent: string;
    partyName?: string;
    amountPaise?: number;
    itemName?: string;
    quantity?: number;
  }) => void;
  apiBaseUrl: string;
  authToken: string;
}

export const VoiceAssistantView: React.FC<VoiceAssistantViewProps> = ({
  onExecuteVoiceMutation,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioWave, setAudioWave] = useState<number[]>([12, 28, 44, 22, 16, 34, 48, 14]);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    intent: string;
    titleVernacular: string;
    partyName?: string;
    amountPaise?: number;
    itemName?: string;
    quantity?: number;
    language: string;
  } | null>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  // Audio wave pulse animation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioWave((prev) => prev.map(() => Math.floor(Math.random() * 45) + 10));
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle mock and real voice actions
  const triggerSampleVoiceCommand = (sample: {
    spokenText: string;
    language: string;
    intent: string;
    titleVernacular: string;
    partyName?: string;
    amountPaise?: number;
    itemName?: string;
    quantity?: number;
  }) => {
    setSpokenTranscript(sample.spokenText);
    setExecutionResult(null);
    setPendingConfirmation({
      intent: sample.intent,
      titleVernacular: sample.titleVernacular,
      partyName: sample.partyName,
      amountPaise: sample.amountPaise,
      itemName: sample.itemName,
      quantity: sample.quantity,
      language: sample.language,
    });
  };

  const handleConfirmAndMutate = () => {
    if (!pendingConfirmation) return;
    onExecuteVoiceMutation({
      intent: pendingConfirmation.intent,
      partyName: pendingConfirmation.partyName,
      amountPaise: pendingConfirmation.amountPaise,
      itemName: pendingConfirmation.itemName,
      quantity: pendingConfirmation.quantity,
    });
    setExecutionResult(
      `सफलतापूर्वक लेजर में दर्ज: ${pendingConfirmation.titleVernacular}`
    );
    setPendingConfirmation(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div className="text-center">
        <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          भाषाब्रिज • BhashaBridge Multilingual AI
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          आवाज़ से व्यापार संचालन • Voice Assistant
        </h1>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
          पंजाबी, हिंदी, या हिंग्लिश में बोलें। व्यापार ओएस इरादा और आंकड़े पहचानकर पुष्टि के बाद ही बहीखाते में दर्ज करता है।
        </p>
      </div>

      {/* Tactile Voice Orb Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glowing backdrop circle */}
        <div className="absolute w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <span className="text-xs text-slate-400 mb-6 font-medium">
          {isRecording
            ? '🔴 आपकी आवाज़ सुनी जा रही है... (Listening...)'
            : 'माइक दबाकर रखें और बोलें (Press & Hold to Speak)'}
        </span>

        {/* Big Tactile Push-to-Talk Button */}
        <button
          onMouseDown={() => {
            setIsRecording(true);
            setSpokenTranscript('');
            setExecutionResult(null);
          }}
          onMouseUp={() => {
            setIsRecording(false);
            // Simulate realistic speech intent extraction
            triggerSampleVoiceCommand({
              spokenText: 'रमेश नू 500 दा उधार पा दे (Ramesh nu 500 da udhaar pa de)',
              language: 'pa-IN',
              intent: 'RECORD_CREDIT_UDHAAR',
              titleVernacular: 'ਰਮੇਸ਼ ਦੇ ਖਾਤੇ ਵਿੱਚ ₹500 ਉਧਾਰ ਦਰਜ ਕਰਨਾ (Record ₹500 Credit to Ramesh)',
              partyName: 'रमेश कुमार (Ramesh Kirana)',
              amountPaise: 50000,
            });
          }}
          onTouchStart={() => {
            setIsRecording(true);
            setSpokenTranscript('');
            setExecutionResult(null);
          }}
          onTouchEnd={() => {
            setIsRecording(false);
            triggerSampleVoiceCommand({
              spokenText: 'रमेश नू 500 दा उधार पा दे (Ramesh nu 500 da udhaar pa de)',
              language: 'pa-IN',
              intent: 'RECORD_CREDIT_UDHAAR',
              titleVernacular: 'ਰਮੇਸ਼ ਦੇ ਖਾਤੇ ਵਿੱਚ ₹500 ਉਧਾਰ ਦਰਜ ਕਰਨਾ (Record ₹500 Credit to Ramesh)',
              partyName: 'रमेश कुमार (Ramesh Kirana)',
              amountPaise: 50000,
            });
          }}
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl cursor-pointer ${
            isRecording
              ? 'bg-rose-500 scale-110 ring-8 ring-rose-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 active:scale-95 ring-4 ring-emerald-500/20 shadow-emerald-500/20'
          }`}
        >
          <MicIcon className="w-12 h-12 text-slate-950" />
        </button>

        {/* Live Audio Waveform */}
        {isRecording && (
          <div className="flex items-center gap-1.5 h-12 mt-6">
            {audioWave.map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className="w-1.5 bg-rose-400 rounded-full transition-all duration-75"
              />
            ))}
          </div>
        )}

        {/* Spoken Transcript Preview */}
        {spokenTranscript && !isRecording && (
          <div className="mt-6 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center max-w-md w-full">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">
              पहचाना गया कथन (Detected Voice):
            </span>
            <p className="text-xs text-sky-300 font-mono mt-1">"{spokenTranscript}"</p>
          </div>
        )}

        {/* Execution Success Toast */}
        {executionResult && (
          <div className="mt-4 p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-emerald-400" />
            <span>{executionResult}</span>
          </div>
        )}
      </div>

      {/* Human Approval Confirmation Dialog (Invariant: Section 6.3) */}
      {pendingConfirmation && (
        <div className="bg-slate-900 border border-sky-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              पुष्टि आवश्यक है • Confirmation Required
            </h2>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">कार्रवाई (Intent):</span>
              <span className="font-semibold text-sky-400">
                {pendingConfirmation.intent}
              </span>
            </div>

            {pendingConfirmation.partyName && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">ग्राहक (Party):</span>
                <span className="font-bold text-white">
                  {pendingConfirmation.partyName}
                </span>
              </div>
            )}

            {pendingConfirmation.amountPaise && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">राशि (Amount):</span>
                <span className="font-black text-amber-300 text-sm">
                  {formatRupees(pendingConfirmation.amountPaise)}
                </span>
              </div>
            )}

            {pendingConfirmation.itemName && (
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-500">वस्तु / मात्रा:</span>
                <span className="font-semibold text-white">
                  {pendingConfirmation.quantity} {pendingConfirmation.itemName}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-medium italic">
              "ਕੀ ਤੁਸੀਂ ਇਸਨੂੰ ਲੇਜ਼ਰ ਵਿੱਚ ਦਰਜ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ? (Confirm posting?)"
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-4">
            <button
              onClick={() => setPendingConfirmation(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <CloseIcon className="w-3.5 h-3.5" />
              <span>रद्द करें (Cancel)</span>
            </button>
            <button
              onClick={handleConfirmAndMutate}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5 active:scale-95"
            >
              <CheckIcon className="w-4 h-4 text-slate-950" />
              <span>स्वीकार एवं लेजर में दर्ज करें (Confirm &amp; Post)</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Vernacular Speech Test Prompts */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
          नमूना आवाज़ निर्देश • Sample Voice Test Prompts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            onClick={() =>
              triggerSampleVoiceCommand({
                spokenText: 'ਰਮੇਸ਼ ਨੂੰ 500 ਦਾ ਉਧਾਰ ਪਾ ਦੇ (Ramesh nu 500 da udhaar pa de)',
                language: 'pa-IN',
                intent: 'RECORD_CREDIT_UDHAAR',
                titleVernacular: 'ਰਮੇਸ਼ ਦੇ ਖਾਤੇ ਵਿੱਚ ₹500 ਉਧਾਰ ਦਰਜ ਕਰਨਾ',
                partyName: 'रमेश कुमार (Ramesh Kirana)',
                amountPaise: 50000,
              })
            }
            className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-left transition"
          >
            <span className="font-semibold text-amber-300 block">
              "ਰਮੇਸ਼ ਨੂੰ 500 ਦਾ ਉਧਾਰ ਪਾ ਦੇ"
            </span>
            <span className="text-[10px] text-slate-500">
              Punjabi • ₹500 Udhaar to Ramesh
            </span>
          </button>

          <button
            onClick={() =>
              triggerSampleVoiceCommand({
                spokenText: 'हरप्रीत से 1000 रुपये जमा प्राप्त हुए',
                language: 'hi-IN',
                intent: 'RECORD_CREDIT_UDHAAR',
                titleVernacular: 'हरप्रीत के खाते में ₹1,000 जमा दर्ज करना',
                partyName: 'ਸ. ਹਰਪ੍ਰੀਤ ਸਿੰਘ (Harpreet Transport)',
                amountPaise: 100000,
              })
            }
            className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-left transition"
          >
            <span className="font-semibold text-emerald-300 block">
              "हरप्रीत से 1000 रुपये जमा प्राप्त हुए"
            </span>
            <span className="text-[10px] text-slate-500">
              Hindi • Record ₹1,000 payment from Harpreet
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

