import React, { useState } from 'react';
import { formatRupees, InventoryItem } from '@vyapar-os/shared';
import {
  PackageIcon,
  SearchIcon,
  PlusIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  CheckIcon,
  CloseIcon,
} from '../Icons';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddStockMovement: (
    itemId: string,
    movementType: 'PURCHASE' | 'SALE' | 'DAMAGE' | 'ADJUSTMENT',
    qty: number,
    notes: string
  ) => void;
  onOrderViaWhatsApp: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onAddStockMovement,
  onOrderViaWhatsApp,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(inventory[0]?.id || '');
  const [movementType, setMovementType] = useState<
    'PURCHASE' | 'SALE' | 'DAMAGE' | 'ADJUSTMENT'
  >('PURCHASE');
  const [quantity, setQuantity] = useState<number>(10);
  const [notes, setNotes] = useState('');

  const filtered = inventory.filter(
    (item) =>
      item.nameEnglish.toLowerCase().includes(search.toLowerCase()) ||
      item.nameVernacular.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;
    onAddStockMovement(selectedItemId, movementType, quantity, notes);
    setIsModalOpen(false);
    setNotes('');
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full px-4 py-2">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-1">
            वस्तु एवं भंडार • Stock &amp; Inventory
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            स्टॉक खाता • Inventory Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            अपरिवर्तनीय स्टॉक लेजर, न्यूनतम सीमा चेतावनी, और सप्लायर री-ऑर्डर
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <PlusIcon className="w-4 h-4 text-slate-950" />
          <span>+ स्टॉक आमद / निकासी (Movement)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="वस्तु का नाम, SKU या HSN कोड खोजें..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Inventory Item Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item) => {
          const isLowStock = item.currentStockQty <= item.reorderThresholdQty;

          return (
            <div
              key={item.id}
              className={`p-4 bg-slate-900/80 border rounded-2xl shadow-xl flex flex-col justify-between gap-3 transition backdrop-blur-xl ${
                isLowStock ? 'border-rose-500/30' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.sku} • HSN {item.hsnCode}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {item.nameEnglish}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.nameVernacular}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      isLowStock
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isLowStock ? 'कम स्टॉक (Low Stock)' : 'पर्याप्त (In Stock)'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">
                      वर्तमान मात्रा (Stock)
                    </span>
                    <span
                      className={`text-base font-black ${
                        isLowStock ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {item.currentStockQty} {item.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">
                      न्यूनतम सीमा (Threshold)
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {item.reorderThresholdQty} {item.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block">
                      दर / GST
                    </span>
                    <span className="text-xs font-semibold text-sky-400 font-mono">
                      {formatRupees(item.unitPricePaise)} ({item.gstRate}%)
                    </span>
                  </div>
                </div>
              </div>

              {isLowStock && (
                <button
                  onClick={() => onOrderViaWhatsApp(item)}
                  className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquareIcon className="w-3.5 h-3.5" />
                  <span>सप्लायर को WhatsApp PO भेजें</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Stock Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <PackageIcon className="w-5 h-5 text-sky-400" />
                <span>स्टॉक लेजर प्रविष्टि • Stock Movement</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitMovement} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  वस्तु चुनें (Select Commodity)
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nameEnglish} ({item.currentStockQty} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  लेनदेन का प्रकार (Movement Type)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { type: 'PURCHASE', label: 'खरीद आमद (Purchase In)' },
                      { type: 'SALE', label: 'बिक्री निकासी (Sale Out)' },
                      { type: 'DAMAGE', label: 'खराब / नुकसान (Damage)' },
                      { type: 'ADJUSTMENT', label: 'ऑडिट सुधार (Adjustment)' },
                    ] as const
                  ).map((m) => (
                    <button
                      type="button"
                      key={m.type}
                      onClick={() => setMovementType(m.type)}
                      className={`py-2 px-2.5 rounded-xl text-center font-medium transition ${
                        movementType === m.type
                          ? 'bg-sky-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  मात्रा (Quantity)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  टिप्पणी या बिल संदर्भ (Notes / Invoice Ref)
                </label>
                <input
                  type="text"
                  placeholder="उदा. थोक मंडी खरीद या बिल #401"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <CheckIcon className="w-4 h-4 text-slate-950" />
                  <span>लेजर में दर्ज करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

