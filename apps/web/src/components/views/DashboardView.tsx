import React from 'react';
import { formatRupees } from '@vyapar-os/shared';
import {
  CameraIcon,
  MicIcon,
  BookOpenIcon,
  PackageIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  ReceiptIcon,
  CheckIcon,
} from '../Icons';
import { AppInvoice } from '../../lib/mock-data';
import { InventoryItem, Party } from '@vyapar-os/shared';

interface DashboardViewProps {
  invoices: AppInvoice[];
  inventory: InventoryItem[];
  parties: Party[];
  onNavigate: (tab: any) => void;
  onOpenScan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  inventory,
  parties,
  onNavigate,
  onOpenScan,
}) => {
  // Real-time calculations
  const totalSalesPaise = invoices
    .filter((inv) => inv.status === 'POSTED')
    .reduce((sum, inv) => sum + inv.grandTotalPaisa, 0);

  const totalUdhaarReceivablePaise = parties.reduce(
    (sum, p) => sum + p.currentBalancePaise,
    0
  );

  const lowStockItems = inventory.filter(
    (item) => item.currentStockQty <= item.reorderThresholdQty
  );

  const pendingReviewsCount = invoices.filter(
    (inv) => inv.status === 'NEEDS_REVIEW' || inv.status === 'EXTRACTED'
  ).length;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4 py-2">
      {/* Vernacular Greeting & Shop Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/70 border border-slate-800/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                दुकान डैशबोर्ड • ਦੁਕਾਨ ਡੈਸ਼ਬੋਰਡ
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              श्री गणेश किराना स्टोर <span className="text-slate-400 font-normal text-lg">| Shri Ganesh Store</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              लुधियाना, पंजाब (03) • GSTIN: 03AABCU9603R1ZM
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenScan}
              className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center gap-2"
            >
              <CameraIcon className="w-4 h-4 text-slate-950" />
              <span>कच्चा बिल स्कैन</span>
            </button>
            <button
              onClick={() => onNavigate('voice')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              <MicIcon className="w-4 h-4 text-slate-950" />
              <span>बोलकर आदेश</span>
            </button>
          </div>
        </div>

        {/* Ambient decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Core Merchant Numbers (4 Primary Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Sales */}
        <div
          onClick={() => onNavigate('bills')}
          className="cursor-pointer group p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/30 rounded-2xl shadow-xl transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              आज की बिक्री
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ReceiptIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-white tracking-tight">
            {formatRupees(totalSalesPaise)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Posted Sales</span>
            <span className="text-sky-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
              View <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Total Udhaar Outstanding */}
        <div
          onClick={() => onNavigate('udhaar')}
          className="cursor-pointer group p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-2xl shadow-xl transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
              कुल बकाया उधार
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <BookOpenIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-300 tracking-tight">
            {formatRupees(totalUdhaarReceivablePaise)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>{parties.length} Customers</span>
            <span className="text-amber-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
              Ledger <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className="cursor-pointer group p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/30 rounded-2xl shadow-xl transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400/90">
              कम स्टॉक अलर्ट
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangleIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-rose-400 tracking-tight">
            {lowStockItems.length} <span className="text-xs text-slate-400 font-normal">वस्तुएं</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Reorder needed</span>
            <span className="text-rose-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
              Restock <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Pending Bill Reviews */}
        <div
          onClick={() => onNavigate('bills')}
          className="cursor-pointer group p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/30 rounded-2xl shadow-xl transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">
              समीक्षा लंबित बिल
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-400 tracking-tight">
            {pendingReviewsCount} <span className="text-xs text-slate-400 font-normal">पर्चे</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
            <span>Verify & Post</span>
            <span className="text-emerald-400 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
              Review <ArrowRightIcon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Dock */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-300">त्वरित कार्य • Quick Actions:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('udhaar')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <BookOpenIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>+ नया उधार दर्ज करें</span>
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <PackageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>+ स्टॉक माल आमद</span>
          </button>
          <button
            onClick={() => onNavigate('gst')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl transition flex items-center gap-1.5"
          >
            <ReceiptIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>GSTR-1 रिटर्न डाउनलोड</span>
          </button>
        </div>
      </div>

      {/* Recent Ledger Activity & Low Stock Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Invoices Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <ReceiptIcon className="w-4 h-4 text-sky-400" />
              <span>हालिया बिल • Recent Invoices</span>
            </h2>
            <button
              onClick={() => onNavigate('bills')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              सभी देखें
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {invoices.slice(0, 3).map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        inv.status === 'POSTED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {inv.customerName}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-white block">
                    {formatRupees(inv.grandTotalPaisa)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {inv.paymentMode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Urgent Items */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 text-rose-400" />
              <span>स्टॉक री-ऑर्डर अलर्ट • Urgent Restock</span>
            </h2>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              इन्वेंटरी खोलें
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                सभी वस्तुओं का स्टॉक पर्याप्त है।
              </p>
            ) : (
              lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      {item.nameEnglish}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {item.nameVernacular}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-400 block">
                      {item.currentStockQty} {item.unit} शेष
                    </span>
                    <span className="text-[10px] text-slate-500">
                      न्यूनतम: {item.reorderThresholdQty} {item.unit}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

