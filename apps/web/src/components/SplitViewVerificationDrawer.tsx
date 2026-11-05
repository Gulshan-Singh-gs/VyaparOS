import React, { useState } from 'react';
import { CloseIcon, CheckIcon, BoltIcon, AlertTriangleIcon } from './Icons';

export interface LineItem {
  rawTextVernacular: string;
  normalizedItemName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  statedLineTotal: number;
  gstRatePercent: number;
  confidenceScore: number;
}

export interface Anomaly {
  code: string;
  fieldPath: string;
  message: string;
  expectedValue?: any;
  actualValue?: any;
}

interface SplitViewVerificationDrawerProps {
  previewUrl: string;
  initialItems: LineItem[];
  initialAnomalies: Anomaly[];
  onSave: (items: LineItem[]) => void;
  onClose: () => void;
}

export const SplitViewVerificationDrawer: React.FC<SplitViewVerificationDrawerProps> = ({
  previewUrl,
  initialItems,
  initialAnomalies,
  onSave,
  onClose,
}) => {
  const [items, setItems] = useState<LineItem[]>(initialItems);
  const [anomalies, setAnomalies] = useState<Anomaly[]>(initialAnomalies);

  const handleFixArithmetic = (index: number) => {
    const updated = [...items];
    const target = updated[index];
    const calculated = Math.round(target.quantity * target.unitPrice * 100) / 100;
    target.statedLineTotal = calculated;
    setItems(updated);

    // Clear matching arithmetic anomaly
    setAnomalies((prev) =>
      prev.filter((a) => !a.fieldPath.includes(`lineItems[${index}]`)),
    );
  };

  const updateField = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col md:flex-row overflow-hidden">
      {/* Left pane: Image Reference View */}
      <div className="w-full md:w-1/2 h-64 md:h-full bg-slate-950/90 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 font-mono">
          Scanned Document Visual
        </div>
        <img
          src={previewUrl}
          alt="Scanned Bill"
          className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
        />
      </div>

      {/* Right pane: Editable Line-Item Rows with Amber Flag Highlights */}
      <div className="w-full md:w-1/2 flex-1 flex flex-col bg-slate-900 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Line Item Verification</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review extracted fields. Amber indicators highlight arithmetic or confidence alerts.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Drawer"
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 my-4 flex-1">
          {items.map((item, idx) => {
            const hasMathMismatch = anomalies.some(
              (a) =>
                a.code === 'ARITHMETIC_MISMATCH' &&
                a.fieldPath.includes(`lineItems[${idx}]`),
            );
            const hasLowConf = item.confidenceScore < 0.78;

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  hasMathMismatch || hasLowConf
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-slate-800 bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-slate-300">
                    Row {idx + 1} • <span className="text-slate-400 italic font-sans">{item.rawTextVernacular}</span>
                  </span>
                  <div className="flex gap-2 items-center">
                    {hasMathMismatch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <AlertTriangleIcon className="w-3 h-3" />
                        Math Discrepancy
                      </span>
                    )}
                    {hasLowConf && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        Low Conf ({Math.round(item.confidenceScore * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Item</label>
                    <input
                      type="text"
                      value={item.normalizedItemName}
                      onChange={(e) => updateField(idx, 'normalizedItemName', e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Qty &amp; Unit</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-1/2 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                      />
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateField(idx, 'unit', e.target.value)}
                        className="w-1/2 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Rate (₹)</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateField(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Line Total (₹)</label>
                    <input
                      type="number"
                      value={item.statedLineTotal}
                      onChange={(e) => updateField(idx, 'statedLineTotal', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {hasMathMismatch && (
                  <div className="mt-3 flex items-center justify-between bg-amber-950/30 border border-amber-500/20 p-2.5 rounded-xl">
                    <span className="text-xs text-amber-200">
                      Calculated product: ₹{Math.round(item.quantity * item.unitPrice * 100) / 100}
                    </span>
                    <button
                      onClick={() => handleFixArithmetic(idx)}
                      className="inline-flex items-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow transition active:scale-95"
                    >
                      <BoltIcon className="w-3.5 h-3.5" />
                      <span>Auto-Fix Math</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => onSave(items)}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CheckIcon className="w-4 h-4 text-slate-950" />
            <span>Verify &amp; Commit to Ledger</span>
          </button>
        </div>
      </div>
    </div>
  );
};
