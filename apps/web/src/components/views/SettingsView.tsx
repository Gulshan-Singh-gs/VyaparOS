import React, { useState } from 'react';
import {
  CogIcon,
  ShieldCheckIcon,
  RefreshIcon,
  CheckIcon,
} from '../Icons';

interface SettingsViewProps {
  apiBaseUrl: string;
  isOnline: boolean;
  onSyncOfflineQueue: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  apiBaseUrl,
  isOnline,
  onSyncOfflineQueue,
}) => {
  const [businessName, setBusinessName] = useState('श्री गणेश किराना स्टोर (Shri Ganesh Store)');
  const [gstin, setGstin] = useState('03AABCU9603R1ZM');
  const [stateCode, setStateCode] = useState('03'); // Punjab
  const [preferredLang, setPreferredLang] = useState<'hi' | 'pa' | 'en' | 'hinglish'>('hinglish');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    await onSyncOfflineQueue();
    setTimeout(() => setSyncing(false), 600);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div>
        <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
          सिस्टम एवं विन्यास • Preferences &amp; Config
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          दुकान सेटिंग्स • Merchant Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          व्यापार प्रोफाइल, जीएसटी विवरण, स्थानीय भाषा प्राथमिकता, और ऑफ़लाइन सिंक
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5 text-xs">
        {/* Business Profile Card */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-4 backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CogIcon className="w-4 h-4 text-sky-400" />
            <span>व्यापार प्रोफाइल (Merchant Identity)</span>
          </h2>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                प्रतिष्ठान का नाम (Firm / Business Name)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  GSTIN (15-अंक)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  राज्य कोड (Place of Supply Code)
                </label>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="03">03 — पंजाब (Punjab)</option>
                  <option value="06">06 — हरियाणा (Haryana)</option>
                  <option value="07">07 — दिल्ली (Delhi)</option>
                  <option value="08">08 — राजस्थान (Rajasthan)</option>
                  <option value="09">09 — उत्तर प्रदेश (Uttar Pradesh)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vernacular Language Preferences */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-4 backdrop-blur-xl">
          <h2 className="text-sm font-bold text-white">
            पसंदीदा भाषा (Vernacular Language &amp; Dialect)
          </h2>
          <p className="text-xs text-slate-400 -mt-2">
            आवाज़ और इंटरफ़ेस की मुख्य भाषा चुनें:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'hinglish', label: 'Hinglish (हिंग्लिश)', sub: 'Default' },
              { id: 'hi', label: 'हिन्दी (Hindi)', sub: 'देवनागरी' },
              { id: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', sub: 'ਗੁਰਮੁਖੀ' },
              { id: 'en', label: 'English', sub: 'Standard' },
            ].map((lang) => (
              <button
                type="button"
                key={lang.id}
                onClick={() => setPreferredLang(lang.id as any)}
                className={`p-3 rounded-2xl border text-center transition ${
                  preferredLang === lang.id
                    ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block text-xs">{lang.label}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{lang.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Offline & Sync Infrastructure */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl flex flex-col gap-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                स्थानीय स्टोरेज एवं सिंक (IndexedDB Outbox)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                नेटवर्क न होने पर सभी बिल और उधारी स्थानीय डिवाइस पर सुरक्षित रहती है।
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                isOnline
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isOnline ? 'Online (Synced)' : 'Offline Active'}
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
            <span className="text-slate-400 text-[11px] font-mono">
              API Base: {apiBaseUrl}
            </span>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing || !isOnline}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'सिंक हो रहा है...' : 'मैन्युअल सिंक करें (Force Sync)'}</span>
            </button>
          </div>
        </div>

        {/* Tenant Isolation & Security Notice */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-3">
          <ShieldCheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">टेनेंट आइसोलेशन सुरक्षित:</strong> आपका डेटा केवल आपके सत्यापित मर्चेंट टोकन से एन्क्रिप्ट और पृथक रहता है।
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saveSuccess && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckIcon className="w-4 h-4" />
              <span>सेटिंग्स सुरक्षित कर ली गईं!</span>
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-sky-500/20 transition active:scale-95"
          >
            सेटिंग्स सहेजें (Save Settings)
          </button>
        </div>
      </form>
    </div>
  );
};

