import React, { useState } from 'react';
import {
  formatRupees,
  rupeesToPaise,
  Party,
  UdhaarTransactionRecord,
} from '@vyapar-os/shared';
import {
  BookOpenIcon,
  SearchIcon,
  PlusIcon,
  MessageSquareIcon,
  CheckIcon,
  CloseIcon,
  UserIcon,
} from '../Icons';

interface UdhaarViewProps {
  parties: Party[];
  transactions: UdhaarTransactionRecord[];
  onAddCreditSale: (customerId: string, amountPaise: number, notes: string) => void;
  onRecordPayment: (customerId: string, amountPaise: number, mode: any, notes: string) => void;
}

export const UdhaarView: React.FC<UdhaarViewProps> = ({
  parties,
  transactions,
  onAddCreditSale,
  onRecordPayment,
}) => {
  const [search, setSearch] = useState('');
  const [selectedParty, setSelectedParty] = useState<Party | null>(parties[0] || null);

  // Modals state
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalPartyId, setModalPartyId] = useState(parties[0]?.id || '');
  const [amountRupees, setAmountRupees] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('UPI');

  const totalOutstandingPaise = parties.reduce(
    (acc, p) => acc + p.currentBalancePaise,
    0
  );

  const filteredParties = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search)
  );

  const partyTransactions = selectedParty
    ? transactions.filter((t) => t.customerId === selectedParty.id)
    : [];

  const handleCreateCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0 || !modalPartyId) return;
    onAddCreditSale(modalPartyId, paise, notes);
    setIsCreditModalOpen(false);
    setAmountRupees('');
    setNotes('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const paise = rupeesToPaise(amountRupees);
    if (paise <= 0 || !modalPartyId) return;
    onRecordPayment(modalPartyId, paise, paymentMode, notes);
    setIsPaymentModalOpen(false);
    setAmountRupees('');
    setNotes('');
  };

  const buildReminderWhatsApp = (party: Party) => {
    const phone = party.phone.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const amountStr = formatRupees(party.currentBalancePaise);
    const text = encodeURIComponent(
      `नमस्ते ${party.name} जी,\n\nश्री गणेश किराना स्टोर से विनम्र निवेदन: आपके खाते में ₹${amountStr} का बकाया शेष है।\nकृपया सुविधानुसार UPI या नकद में भुगतान करने की कृपा करें।\n\nधन्यवाद!\nश्री गणेश स्टोर`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
            ग्राहक साख एवं उधारी • Customer Credit &amp; Udhaar
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            उधार बहीखाता • Udhaar Register
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            अपरिवर्तनीय ग्राहक क्रेडिट लेजर, शेष राशि ट्रैकिंग, और WhatsApp तगादा
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setModalPartyId(selectedParty?.id || parties[0]?.id || '');
              setIsPaymentModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <CheckIcon className="w-4 h-4 text-slate-950" />
            <span>+ जमा / भुगतान (Payment)</span>
          </button>
          <button
            onClick={() => {
              setModalPartyId(selectedParty?.id || parties[0]?.id || '');
              setIsCreditModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
          >
            <PlusIcon className="w-4 h-4 text-slate-950" />
            <span>+ नया उधार (Give Credit)</span>
          </button>
        </div>
      </div>

      {/* Aggregate Udhaar Metric Card */}
      <div className="p-5 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl shadow-xl flex items-center justify-between backdrop-blur-xl">
        <div>
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider block">
            कुल बाजार उधारी (Total Market Udhaar)
          </span>
          <span className="text-2xl md:text-3xl font-black text-amber-300 mt-1 block tracking-tight">
            {formatRupees(totalOutstandingPaise)}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">
            कुल {parties.length} ग्राहकों का खाता सक्रिय है
          </span>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <BookOpenIcon className="w-7 h-7" />
        </div>
      </div>

      {/* Split Customer Directory & Transaction History */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Customer List (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="ग्राहक का नाम या फोन नंबर..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredParties.map((p) => {
              const isSelected = selectedParty?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedParty(p)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-tight">
                        {p.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                        📞 {p.phone}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-300 block">
                        {formatRupees(p.currentBalancePaise)}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase">
                        बकाया शेष
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Customer Statement (7 cols) */}
        <div className="md:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between backdrop-blur-xl">
          {selectedParty ? (
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">{selectedParty.name}</h2>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    शहर: {selectedParty.city || 'पंजाब'} • साख सीमा: {formatRupees(selectedParty.creditLimitPaise)}
                  </span>
                </div>

                <a
                  href={buildReminderWhatsApp(selectedParty)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <MessageSquareIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp तगादा</span>
                </a>
              </div>

              {/* Outstanding Balance Banner */}
              <div className="my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">वर्तमान कुल देय:</span>
                <span className="text-lg font-black text-amber-300">
                  {formatRupees(selectedParty.currentBalancePaise)}
                </span>
              </div>

              {/* Transactions Timeline */}
              <h3 className="text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                खाता विवरण • Statement Timeline
              </h3>
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {partyTransactions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    इस ग्राहक के खाते में कोई हालिया लेनदेन नहीं है।
                  </p>
                ) : (
                  partyTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              tx.transactionType === 'CREDIT_SALE'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {tx.transactionType === 'CREDIT_SALE' ? 'उधार बिक्री' : 'जमा / भुगतान'}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">
                            {new Date(tx.timestamp).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        {tx.notes && (
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {tx.notes}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black ${
                            tx.transactionType === 'CREDIT_SALE'
                              ? 'text-amber-300'
                              : 'text-emerald-400'
                          }`}
                        >
                          {tx.transactionType === 'CREDIT_SALE' ? '+' : '-'}
                          {formatRupees(tx.amountPaise)}
                        </span>
                        {tx.paymentMode && (
                          <span className="text-[9px] text-slate-500 block">
                            via {tx.paymentMode}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs">
              कृपया विवरण देखने के लिए बाएं से ग्राहक चुनें
            </div>
          )}
        </div>
      </div>

      {/* Give Credit Modal */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-amber-400" />
                <span>नया उधार दर्ज करें • Give Credit</span>
              </h2>
              <button
                onClick={() => setIsCreditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredit} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  ग्राहक (Customer)
                </label>
                <select
                  value={modalPartyId}
                  onChange={(e) => setModalPartyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (बकाया: {formatRupees(p.currentBalancePaise)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  उधार राशि (₹ Amount)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="उदा. 500"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  वस्तु विवरण या पर्चा संदर्भ (Items / Notes)
                </label>
                <input
                  type="text"
                  placeholder="उदा. 5 किलो चीनी + 2 पैकेट तेल"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <CheckIcon className="w-4 h-4 text-slate-950" />
                  <span>खाते में उधार जोड़ें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-emerald-400" />
                <span>जमा भुगतान दर्ज करें • Record Payment</span>
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  ग्राहक (Customer)
                </label>
                <select
                  value={modalPartyId}
                  onChange={(e) => setModalPartyId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (बकाया: {formatRupees(p.currentBalancePaise)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  जमा राशि (₹ Amount Received)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="उदा. 1000"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  भुगतान का माध्यम (Payment Mode)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setPaymentMode(m)}
                      className={`py-2 rounded-xl text-center font-semibold transition ${
                        paymentMode === m
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  संदर्भ / टिप्पणी (UPI Ref ID / Notes)
                </label>
                <input
                  type="text"
                  placeholder="उदा. PhonePe #TXN123456"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <CheckIcon className="w-4 h-4 text-slate-950" />
                  <span>खाते में जमा करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

