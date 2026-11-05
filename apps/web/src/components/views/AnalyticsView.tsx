import React from 'react';
import { formatRupees, InventoryItem, Party } from '@vyapar-os/shared';
import { ChartBarIcon, ReceiptIcon, BookOpenIcon, PackageIcon } from '../Icons';
import { AppInvoice } from '../../lib/mock-data';

interface AnalyticsViewProps {
  invoices: AppInvoice[];
  inventory: InventoryItem[];
  parties: Party[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  invoices,
  inventory,
  parties,
}) => {
  const totalSalesPaise = invoices
    .filter((inv) => inv.status === 'POSTED')
    .reduce((sum, inv) => sum + inv.grandTotalPaisa, 0);

  const cashSalesPaise = invoices
    .filter((inv) => inv.status === 'POSTED' && inv.paymentMode === 'CASH')
    .reduce((sum, inv) => sum + inv.grandTotalPaisa, 0);

  const upiSalesPaise = invoices
    .filter((inv) => inv.status === 'POSTED' && inv.paymentMode === 'UPI')
    .reduce((sum, inv) => sum + inv.grandTotalPaisa, 0);

  const udhaarSalesPaise = invoices
    .filter((inv) => inv.status === 'POSTED' && inv.paymentMode === 'UDHAAR_CREDIT')
    .reduce((sum, inv) => sum + inv.grandTotalPaisa, 0);

  const totalInventoryAssetPaise = inventory.reduce(
    (sum, item) => sum + item.currentStockQty * item.unitPricePaise,
    0
  );

  const totalOutstandingUdhaar = parties.reduce(
    (sum, p) => sum + p.currentBalancePaise,
    0
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div>
        <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
          व्यापार अंतर्दृष्टि • Business Intelligence
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          दुकान विश्लेषण • Merchant Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          बिक्री रुझान, भुगतान माध्यम अनुपात, उधारी उम्र विश्लेषण, और इन्वेंटरी मूल्य
        </p>
      </div>

      {/* High-level Asset & Revenue Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            कुल दर्ज बिक्री (Total Revenue)
          </span>
          <span className="text-xl font-black text-white mt-1 block">
            {formatRupees(totalSalesPaise)}
          </span>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            ✓ शून्य-फ़्लोटिंग वित्तीय शुद्धता
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            दुकान स्टॉक मूल्यांकन (Stock Asset)
          </span>
          <span className="text-xl font-black text-sky-400 mt-1 block">
            {formatRupees(totalInventoryAssetPaise)}
          </span>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {inventory.length} सक्रिय वस्तुएं
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            मार्केट उधारी (Total Receivables)
          </span>
          <span className="text-xl font-black text-amber-300 mt-1 block">
            {formatRupees(totalOutstandingUdhaar)}
          </span>
          <span className="text-[10px] text-amber-400/80 mt-1 block">
            {parties.length} ग्राहक खाते
          </span>
        </div>
      </div>

      {/* Payment Method Distribution Bar */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          भुगतान माध्यम विभाजन • Payment Distribution
        </h2>

        {/* Visual Progress Ratio */}
        <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex mb-4">
          <div
            style={{
              width: `${
                totalSalesPaise > 0 ? (upiSalesPaise / totalSalesPaise) * 100 : 33
              }%`,
            }}
            className="bg-emerald-500 h-full transition-all"
            title="UPI"
          />
          <div
            style={{
              width: `${
                totalSalesPaise > 0 ? (cashSalesPaise / totalSalesPaise) * 100 : 33
              }%`,
            }}
            className="bg-sky-500 h-full transition-all"
            title="Cash"
          />
          <div
            style={{
              width: `${
                totalSalesPaise > 0 ? (udhaarSalesPaise / totalSalesPaise) * 100 : 34
              }%`,
            }}
            className="bg-amber-500 h-full transition-all"
            title="Udhaar"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-semibold">UPI डिजिटल</span>
            </div>
            <span className="font-bold text-white block">{formatRupees(upiSalesPaise)}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span className="text-slate-300 font-semibold">नकद (Cash)</span>
            </div>
            <span className="font-bold text-white block">{formatRupees(cashSalesPaise)}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300 font-semibold">उधार (Udhaar)</span>
            </div>
            <span className="font-bold text-amber-300 block">{formatRupees(udhaarSalesPaise)}</span>
          </div>
        </div>
      </div>

      {/* Top Commodities Turnover Ranking */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-sky-400" />
          <span>शीर्ष बिक्री वस्तुएं • Top Moving Commodities</span>
        </h2>

        <div className="flex flex-col gap-3">
          {inventory.map((item, idx) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 font-bold flex items-center justify-center font-mono">
                  #{idx + 1}
                </span>
                <div>
                  <h3 className="font-bold text-white">{item.nameEnglish}</h3>
                  <span className="text-[11px] text-slate-400">
                    {item.nameVernacular}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-white block">
                  {formatRupees(item.unitPricePaise)} / {item.unit}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  स्टॉक: {item.currentStockQty} {item.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

