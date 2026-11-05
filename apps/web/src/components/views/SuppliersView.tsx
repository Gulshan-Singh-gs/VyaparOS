import React, { useState } from 'react';
import {
  TruckIcon,
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  PhoneIcon,
} from '../Icons';
import { INITIAL_SUPPLIERS } from '../../lib/mock-data';

interface SuppliersViewProps {
  onDraftPO?: (supplierId: string, items: any[]) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = () => {
  const [suppliers] = useState(INITIAL_SUPPLIERS);
  const [search, setSearch] = useState('');
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]);
  const [poItemName, setPoItemName] = useState('बासमती चावल (Basmati Rice)');
  const [poQty, setPoQty] = useState('20');
  const [poUnit, setPoUnit] = useState('BAG');
  const [poNotes, setPoNotes] = useState('कृपया कल सुबह 10 बजे तक डिलीवरी करवाएं।');

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.commodities.some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  const buildWhatsAppPOLink = (supplier: typeof suppliers[0]) => {
    const phone = supplier.whatsapp.replace(/\D/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const text = encodeURIComponent(
      `नमस्ते ${supplier.contactPerson} जी,\n\nश्री गणेश स्टोर, लुधियाना से नया पर्चेज़ आर्डर (Purchase Order):\n- ${poItemName}: ${poQty} ${poUnit}\nटिप्पणी: ${poNotes}\n\nकृपया बिल और डिलीवरी की पुष्टि करें। धन्यवाद!`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
            आपूर्तिकर्ता एवं खरीद • Suppliers &amp; Procurement
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            थोक सप्लायर डायरेक्टरी • Suppliers Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            मंडी व्यापारी संपर्क, WhatsApp पर्चेज़ आर्डर, और आपूर्ति प्रबंधन
          </p>
        </div>

        <button
          onClick={() => setIsPOModalOpen(true)}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4 text-slate-950" />
          <span>+ नया पर्चेज़ आर्डर बनाएं (Draft PO)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="सप्लायर, मंडी, या वस्तु का नाम खोजें..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Supplier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between gap-4 backdrop-blur-xl"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {s.name}
                  </h3>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    संपर्क: {s.contactPerson} • {s.city}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ★ {s.rating}
                </span>
              </div>

              {/* Commodities Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {s.commodities.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <PhoneIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{s.whatsapp}</span>
              </span>

              <button
                onClick={() => {
                  setSelectedSupplier(s);
                  setIsPOModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <MessageSquareIcon className="w-3.5 h-3.5" />
                <span>ऑर्डर भेजें (WhatsApp)</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PO Draft & WhatsApp Review Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <TruckIcon className="w-5 h-5 text-sky-400" />
                <span>सप्लायर खरीद आदेश • Purchase Order Draft</span>
              </h2>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  आपूर्तिकर्ता चुनें (Select Supplier)
                </label>
                <select
                  value={selectedSupplier.id}
                  onChange={(e) => {
                    const sup = suppliers.find((x) => x.id === e.target.value);
                    if (sup) setSelectedSupplier(sup);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    वस्तु (Commodity)
                  </label>
                  <input
                    type="text"
                    value={poItemName}
                    onChange={(e) => setPoItemName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      मात्रा (Qty)
                    </label>
                    <input
                      type="number"
                      value={poQty}
                      onChange={(e) => setPoQty(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">
                      इकाई (Unit)
                    </label>
                    <select
                      value={poUnit}
                      onChange={(e) => setPoUnit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="BAG">BAG (बोरी)</option>
                      <option value="KG">KG (किलो)</option>
                      <option value="LTR">LTR (लीटर)</option>
                      <option value="BOX">BOX (पेटी)</option>
                      <option value="PCS">PCS (नग)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  ऑर्डर निर्देश (Delivery Instructions)
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Message Preview Box */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                  WhatsApp संदेश पूर्वावलोकन (Pre-flight Review):
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line bg-slate-900/60 p-2 rounded-lg font-mono">
                  नमस्ते {selectedSupplier.contactPerson} जी,{'\n'}
                  श्री गणेश स्टोर से नया पर्चेज़ आर्डर:{'\n'}• {poItemName}: {poQty} {poUnit}{'\n'}
                  टिप्पणी: {poNotes}
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  रद्द करें
                </button>
                <a
                  href={buildWhatsAppPOLink(selectedSupplier)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <MessageSquareIcon className="w-4 h-4 text-slate-950" />
                  <span>WhatsApp पर भेजें (Send)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

