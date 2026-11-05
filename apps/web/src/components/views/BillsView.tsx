import React, { useState } from 'react';
import { formatRupees } from '@vyapar-os/shared';
import {
  CameraIcon,
  ReceiptIcon,
  SearchIcon,
  AlertTriangleIcon,
  CheckIcon,
  ShieldCheckIcon,
} from '../Icons';
import { AppInvoice } from '../../lib/mock-data';

interface BillsViewProps {
  invoices: AppInvoice[];
  onOpenScan: () => void;
  onOpenReview: (invoice: AppInvoice) => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  invoices,
  onOpenScan,
  onOpenReview,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = invoices.filter((inv) => {
    const matchesStatus =
      filterStatus === 'ALL' || inv.status === filterStatus;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
            बिल एवं पर्चे • Invoices &amp; Kacha Bills
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            बिल वही खाता • Billing Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            हस्तलिखित पर्चे, पक्के बिल, और डिजिटल जीएसटी चालान
          </p>
        </div>

        <button
          onClick={onOpenScan}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <CameraIcon className="w-4 h-4 text-slate-950" />
          <span>+ नया पर्चा स्कैन करें</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'NEEDS_REVIEW', 'VERIFIED', 'POSTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              {st === 'ALL' && 'सभी बिल (All)'}
              {st === 'NEEDS_REVIEW' && 'समीक्षा बाकी (Needs Review)'}
              {st === 'VERIFIED' && 'सत्यापित (Verified)'}
              {st === 'POSTED' && 'दर्ज (Posted)'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="बिल नंबर या ग्राहक खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
            <ReceiptIcon className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">कोई बिल नहीं मिला</p>
            <p className="text-xs text-slate-500 mt-1">
              नया बिल अपलोड या स्कैन करने के लिए ऊपर दिए गए बटन का उपयोग करें।
            </p>
          </div>
        ) : (
          filtered.map((inv) => (
            <div
              key={inv.id}
              className="p-4 bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition backdrop-blur-xl"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <ReceiptIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white tracking-wide">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'POSTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {inv.status}
                    </span>
                    {inv.anomaliesCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <AlertTriangleIcon className="w-3 h-3" />
                        <span>{inv.anomaliesCount} Anomaly</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 mt-1">
                    {inv.customerName}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>तारीख: {inv.invoiceDate}</span>
                    <span>•</span>
                    <span>भुगतान: {inv.paymentMode}</span>
                    <span>•</span>
                    <span>{inv.itemCount} वस्तुएं</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                    कुल राशि (Total)
                  </span>
                  <span className="text-base font-black text-white">
                    {formatRupees(inv.grandTotalPaisa)}
                  </span>
                </div>

                <button
                  onClick={() => onOpenReview(inv)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition flex items-center gap-1.5"
                >
                  {inv.status === 'NEEDS_REVIEW' ? (
                    <>
                      <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>समीक्षा करें (Review)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-sky-400" />
                      <span>विवरण देखें</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

