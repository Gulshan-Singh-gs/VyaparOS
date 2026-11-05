import React from 'react';
import { MessageSquareIcon, CheckIcon, CloseIcon, SparklesIcon } from './Icons';

export interface WorkflowItem {
  id: string;
  sourceType: string;
  intent: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payloadJson: any;
  createdAt: string;
}

interface AutoFlowCommandCenterProps {
  workflows: WorkflowItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const AutoFlowCommandCenter: React.FC<AutoFlowCommandCenterProps> = ({
  workflows,
  onApprove,
  onReject,
}) => {
  const buildWhatsAppLink = (payload: any) => {
    const phone = payload.supplierWhatsapp?.replace(/\D/g, '') || '';
    const text = encodeURIComponent(
      `नमस्ते ${payload.supplierName || 'जी'},\n\nव्यापार ओएस ऑटो-ऑर्डर:\nकृपया निम्नलिखित सामान जल्द से जल्द भेजें:\n- ${payload.itemName}: ${payload.suggestedReorderQty} ${payload.unit}\n\nधन्यवाद!`,
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="flex flex-col gap-5 p-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
            Autonomous Actions
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">AutoFlow Command Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pending voice triggers, anomaly remediations, and inventory replenishment flows
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {workflows.filter((w) => w.status === 'PENDING').length} Pending
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {workflows.length === 0 ? (
          <div className="p-10 text-center bg-slate-900/60 rounded-3xl border border-slate-800 shadow-xl">
            <div className="w-12 h-12 mx-auto mb-3 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <p className="text-slate-300 text-sm font-medium">All workflows clear</p>
            <p className="text-slate-500 text-xs mt-1">Autonomous triggers will appear here as bills are scanned or voice orders arrive.</p>
          </div>
        ) : (
          workflows.map((wf) => {
            const isLowStock = wf.sourceType === 'LOW_STOCK_TRIGGER';
            const payload = wf.payloadJson || {};

            return (
              <div
                key={wf.id}
                className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-3 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isLowStock
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {wf.sourceType}
                    </span>
                    <h3 className="text-sm font-semibold text-white mt-2 tracking-tight">{wf.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(wf.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isLowStock && (
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Stock: <strong className="text-rose-400">{payload.remainingQty} {payload.unit}</strong></span>
                      <span>Threshold: <strong className="text-slate-200">{payload.reorderThresholdQty} {payload.unit}</strong></span>
                      <span>Suggested Order: <strong className="text-emerald-400">{payload.suggestedReorderQty} {payload.unit}</strong></span>
                    </div>

                    {payload.supplierWhatsapp && (
                      <a
                        href={buildWhatsAppLink(payload)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold transition"
                      >
                        <MessageSquareIcon className="w-3.5 h-3.5" />
                        <span>Dispatch WhatsApp PO to {payload.supplierName || 'Supplier'}</span>
                      </a>
                    )}
                  </div>
                )}

                {wf.status === 'PENDING' && (
                  <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                    <button
                      onClick={() => onReject(wf.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition flex items-center gap-1.5"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      onClick={() => onApprove(wf.id)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 shadow-md shadow-sky-500/10 transition active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckIcon className="w-3.5 h-3.5 text-slate-950" />
                      <span>Approve &amp; Mutate</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
