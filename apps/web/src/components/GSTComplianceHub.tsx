import React, { useState } from 'react';
import { DownloadIcon, ShieldCheckIcon } from './Icons';

export interface GSTBreakdownData {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
}

interface GSTComplianceHubProps {
  gstBreakdown?: GSTBreakdownData;
  merchantGstin?: string;
  apiBaseUrl: string;
  authToken: string;
}

export const GSTComplianceHub: React.FC<GSTComplianceHubProps> = ({
  gstBreakdown = {
    taxableAmount: 145000,
    cgst: 3625,
    sgst: 3625,
    igst: 0,
    grandTotal: 152250,
  },
  merchantGstin = '03AABCU9603R1ZM',
  apiBaseUrl,
  authToken,
}) => {
  const [period, setPeriod] = useState('112026'); // MMYYYY
  const [downloading, setDownloading] = useState(false);

  const handleDownloadGSTR1 = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`${apiBaseUrl}/gst/export?fp=${period}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSTR1_${merchantGstin}_${period}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      alert(`Could not download GSTR-1: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
            Statutory Compliance
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">GST Compliance Hub</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time B2CS aggregate ledger and GSTR-1 Offline Tool compatible export
          </p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
          <span>{merchantGstin}</span>
        </div>
      </div>

      {/* Tax Breakdown Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Taxable Sales</span>
          <span className="text-lg font-bold text-white mt-1 block tracking-tight">
            ₹{gstBreakdown.taxableAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CGST (Intra)</span>
          <span className="text-lg font-bold text-sky-400 mt-1 block tracking-tight">
            ₹{gstBreakdown.cgst.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SGST (Intra)</span>
          <span className="text-lg font-bold text-sky-400 mt-1 block tracking-tight">
            ₹{gstBreakdown.sgst.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">IGST (Inter)</span>
          <span className="text-lg font-bold text-indigo-400 mt-1 block tracking-tight">
            ₹{gstBreakdown.igst.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* GSTR-1 Export Card */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 backdrop-blur-xl">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Generate Official GSTR-1 JSON</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
            Directly importable into the Government GST Offline Tool (Schema GST3.1.6).
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="112026">Nov 2026 (112026)</option>
            <option value="102026">Oct 2026 (102026)</option>
            <option value="092026">Sep 2026 (092026)</option>
          </select>

          <button
            onClick={handleDownloadGSTR1}
            disabled={downloading}
            className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            <DownloadIcon className="w-4 h-4 text-slate-950" />
            <span>{downloading ? 'Exporting...' : 'Export GSTR-1 JSON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
