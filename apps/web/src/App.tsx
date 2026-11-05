import React, { useState, useEffect } from 'react';
import { CaptureStudio } from './components/CaptureStudio';
import {
  SplitViewVerificationDrawer,
  LineItem,
  Anomaly,
} from './components/SplitViewVerificationDrawer';
import { GSTComplianceHub, GSTBreakdownData } from './components/GSTComplianceHub';
import { AutoFlowCommandCenter, WorkflowItem } from './components/AutoFlowCommandCenter';

// 9 Modular Screen Views
import { DashboardView } from './components/views/DashboardView';
import { BillsView } from './components/views/BillsView';
import { InventoryView } from './components/views/InventoryView';
import { UdhaarView } from './components/views/UdhaarView';
import { SuppliersView } from './components/views/SuppliersView';
import { VoiceAssistantView } from './components/views/VoiceAssistantView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';

// Navigation & Utility Icons
import {
  HomeIcon,
  ReceiptIcon,
  PackageIcon,
  BookOpenIcon,
  TruckIcon,
  MicIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CogIcon,
  BoltIcon,
  CameraIcon,
  CloseIcon,
} from './components/Icons';

import { syncQueue } from './lib/offline-queue';
import {
  INITIAL_INVOICES,
  INITIAL_INVENTORY,
  INITIAL_PARTIES,
  INITIAL_UDHAAR_TXS,
  AppInvoice,
} from './lib/mock-data';
import {
  InventoryItem,
  Party,
  UdhaarTransactionRecord,
  createInventoryMovement,
} from '@vyapar-os/shared';

export type TabType =
  | 'dashboard'
  | 'bills'
  | 'inventory'
  | 'udhaar'
  | 'suppliers'
  | 'voice'
  | 'gst'
  | 'analytics'
  | 'settings'
  | 'autoflow';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api/v1';
  const authToken = 'demo-token';

  // Application State
  const [invoices, setInvoices] = useState<AppInvoice[]>(INITIAL_INVOICES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [parties, setParties] = useState<Party[]>(INITIAL_PARTIES);
  const [udhaarTxs, setUdhaarTxs] = useState<UdhaarTransactionRecord[]>(INITIAL_UDHAAR_TXS);

  // Scan modal & Split-view verification drawer state
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerPreviewUrl, setDrawerPreviewUrl] = useState('');
  const [drawerItems, setDrawerItems] = useState<LineItem[]>([]);
  const [drawerAnomalies, setDrawerAnomalies] = useState<Anomaly[]>([]);
  const [currentReviewInvoiceId, setCurrentReviewInvoiceId] = useState<string | null>(null);

  // AutoFlow Autonomous Triggers state
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([
    {
      id: 'wf_demo_1',
      sourceType: 'LOW_STOCK_TRIGGER',
      intent: 'GENERATE_SUPPLIER_PO',
      title: 'Low stock alert: बासमती चावल (12 BAG remaining)',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      payloadJson: {
        itemName: 'Basmati Rice Premium',
        remainingQty: 12,
        reorderThresholdQty: 25,
        suggestedReorderQty: 20,
        unit: 'BAG',
        supplierName: 'Gupta Rice Mill (Karnal)',
        supplierWhatsapp: '+919876543210',
      },
    },
  ]);

  // GST Summary state
  const [gstSummary] = useState<GSTBreakdownData>({
    taxableAmount: 182400,
    cgst: 4560,
    sgst: 4560,
    igst: 0,
    grandTotal: 191520,
  });

  // Online / Offline listener & auto-sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueue(apiBaseUrl, authToken).then((res) => {
        if (res.processed > 0) {
          console.log(`Synced ${res.succeeded}/${res.processed} offline items.`);
        }
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [apiBaseUrl, authToken]);

  // Scan complete handler
  const handleScanComplete = (data: any, previewUrl: string) => {
    setIsScanModalOpen(false);
    const extraction = data.invoice?.extraction;
    const anomalies = data.invoice?.anomalies || [];

    if (extraction) {
      setDrawerPreviewUrl(previewUrl);
      setDrawerItems(extraction.lineItems || []);
      setDrawerAnomalies(anomalies);
      setCurrentReviewInvoiceId(null);
      setIsDrawerOpen(true);
    }
  };

  // Split-view verification commit handler
  const handleSaveVerifiedBill = (verifiedItems: LineItem[]) => {
    setIsDrawerOpen(false);
    const totalRupees = verifiedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalPaise = Math.round(totalRupees * 100);

    const newInvoice: AppInvoice = {
      id: currentReviewInvoiceId || `inv_${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      customerName: 'नया सत्यापित ग्राहक (Verified Party)',
      invoiceDate: new Date().toISOString().split('T')[0],
      status: 'POSTED',
      paymentMode: 'CASH',
      taxableAmountPaisa: totalPaise,
      cgstPaisa: Math.floor(totalPaise * 0.025),
      sgstPaisa: Math.floor(totalPaise * 0.025),
      igstPaisa: 0,
      grandTotalPaisa: totalPaise + Math.floor(totalPaise * 0.05),
      itemCount: verifiedItems.length,
      anomaliesCount: 0,
    };

    setInvoices((prev) => [newInvoice, ...prev.filter((i) => i.id !== newInvoice.id)]);
    alert('बिल सत्यापित एवं बहीखाते में दर्ज (Bill verified and posted to ledger)!');
  };

  // Open existing invoice in SplitView Drawer
  const handleOpenReviewInvoice = (invoice: AppInvoice) => {
    setCurrentReviewInvoiceId(invoice.id);
    setDrawerPreviewUrl(
      invoice.rawImagePreview ||
        'https://images.unsplash.com/photo-1554415707-9e4c07d30777?w=600&auto=format&fit=crop&q=80'
    );
    setDrawerItems([
      {
        rawTextVernacular: 'बासमती चावल 5 बैग',
        normalizedItemName: 'Basmati Rice',
        hsnCode: '10063010',
        quantity: 5,
        unit: 'BAG',
        unitPrice: 1850,
        statedLineTotal: 9250,
        gstRatePercent: 5,
        confidenceScore: 0.95,
      },
    ]);
    setDrawerAnomalies([]);
    setIsDrawerOpen(true);
  };

  // Inventory Stock Movement Mutation
  const handleAddStockMovement = (
    itemId: string,
    movementType: 'PURCHASE' | 'SALE' | 'DAMAGE' | 'ADJUSTMENT',
    qty: number,
    notes: string
  ) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const movement = createInventoryMovement({
          id: `mov_${Date.now()}`,
          itemId,
          movementType,
          quantity: qty,
          currentStock: item.currentStockQty,
          notes,
        });

        const newStock = item.currentStockQty + movement.quantityChange;

        // AutoFlow trigger if stock drops below threshold
        if (newStock <= item.reorderThresholdQty && movementType === 'SALE') {
          setWorkflows((w) => [
            {
              id: `wf_${Date.now()}`,
              sourceType: 'LOW_STOCK_TRIGGER',
              intent: 'GENERATE_SUPPLIER_PO',
              title: `कम स्टॉक अलर्ट: ${item.nameEnglish} (${newStock} ${item.unit} शेष)`,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              payloadJson: {
                itemName: item.nameEnglish,
                remainingQty: newStock,
                reorderThresholdQty: item.reorderThresholdQty,
                suggestedReorderQty: item.reorderThresholdQty * 2,
                unit: item.unit,
                supplierName: item.supplierName,
                supplierWhatsapp: item.supplierWhatsapp,
              },
            },
            ...w,
          ]);
        }

        return {
          ...item,
          currentStockQty: newStock,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Udhaar Mutations
  const handleAddCreditSale = (customerId: string, amountPaise: number, notes: string) => {
    const newTx: UdhaarTransactionRecord = {
      id: `tx_${Date.now()}`,
      customerId,
      transactionType: 'CREDIT_SALE',
      amountPaise,
      notes,
      timestamp: new Date().toISOString(),
    };

    setUdhaarTxs((prev) => [newTx, ...prev]);
    setParties((prev) =>
      prev.map((p) =>
        p.id === customerId
          ? { ...p, currentBalancePaise: p.currentBalancePaise + amountPaise }
          : p
      )
    );
  };

  const handleRecordPayment = (
    customerId: string,
    amountPaise: number,
    mode: any,
    notes: string
  ) => {
    const newTx: UdhaarTransactionRecord = {
      id: `tx_${Date.now()}`,
      customerId,
      transactionType: 'PAYMENT_RECEIVED',
      amountPaise,
      paymentMode: mode,
      notes,
      timestamp: new Date().toISOString(),
    };

    setUdhaarTxs((prev) => [newTx, ...prev]);
    setParties((prev) =>
      prev.map((p) =>
        p.id === customerId
          ? {
              ...p,
              currentBalancePaise: Math.max(0, p.currentBalancePaise - amountPaise),
            }
          : p
      )
    );
  };

  // Voice command execution
  const handleExecuteVoiceMutation = (action: {
    intent: string;
    partyName?: string;
    amountPaise?: number;
    itemName?: string;
    quantity?: number;
  }) => {
    if (action.intent === 'RECORD_CREDIT_UDHAAR' && action.amountPaise) {
      const party =
        parties.find((p) => action.partyName && p.name.includes(action.partyName)) ||
        parties[0];
      if (party) {
        handleAddCreditSale(party.id, action.amountPaise, 'Voice command via BhashaBridge');
      }
    }
  };

  // WhatsApp Supplier Order shortcut
  const handleOrderViaWhatsApp = (item: InventoryItem) => {
    const phone = item.supplierWhatsapp?.replace(/\D/g, '') || '';
    const text = encodeURIComponent(
      `नमस्ते ${item.supplierName || 'जी'},\n\nश्री गणेश स्टोर, लुधियाना से आर्डर:\nकृपया निम्नलिखित सामान भेजें:\n- ${item.nameEnglish}: ${item.reorderThresholdQty * 2} ${item.unit}\n\nधन्यवाद!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Application Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-sky-500/20 group-hover:scale-105 transition">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">
                  VyaparOS
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  v2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium">
                व्यापार ऑपरेटिंग सिस्टम • ਵਪਾਰ ਓ.ਐਸ.
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'डैशबोर्ड', icon: HomeIcon },
            { id: 'bills', label: 'बिल', icon: ReceiptIcon },
            { id: 'inventory', label: 'इन्वेंटरी', icon: PackageIcon },
            { id: 'udhaar', label: 'उधार', icon: BookOpenIcon },
            { id: 'suppliers', label: 'सप्लायर', icon: TruckIcon },
            { id: 'voice', label: 'आवाज़', icon: MicIcon },
            { id: 'gst', label: 'जीएसटी', icon: ShieldCheckIcon },
            { id: 'analytics', label: 'रिपोर्ट्स', icon: ChartBarIcon },
            { id: 'settings', label: 'सेटिंग्स', icon: CogIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* AutoFlow Pending Badge */}
          <button
            onClick={() => setActiveTab('autoflow')}
            className={`p-2 rounded-xl border relative transition ${
              activeTab === 'autoflow'
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="AutoFlow Autonomous Actions"
          >
            <BoltIcon className="w-4 h-4" />
            {workflows.some((w) => w.status === 'PENDING') && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>

          {/* Online/Offline Status Indicator */}
          <span
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="hidden sm:inline">
              {isOnline ? 'Cloud Synced' : 'Offline Queue Active'}
            </span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 pt-3 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardView
            invoices={invoices}
            inventory={inventory}
            parties={parties}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenScan={() => setIsScanModalOpen(true)}
          />
        )}

        {activeTab === 'bills' && (
          <BillsView
            invoices={invoices}
            onOpenScan={() => setIsScanModalOpen(true)}
            onOpenReview={handleOpenReviewInvoice}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            inventory={inventory}
            onAddStockMovement={handleAddStockMovement}
            onOrderViaWhatsApp={handleOrderViaWhatsApp}
          />
        )}

        {activeTab === 'udhaar' && (
          <UdhaarView
            parties={parties}
            transactions={udhaarTxs}
            onAddCreditSale={handleAddCreditSale}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {activeTab === 'suppliers' && <SuppliersView />}

        {activeTab === 'voice' && (
          <VoiceAssistantView
            onExecuteVoiceMutation={handleExecuteVoiceMutation}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
          />
        )}

        {activeTab === 'gst' && (
          <GSTComplianceHub
            gstBreakdown={gstSummary}
            apiBaseUrl={apiBaseUrl}
            authToken={authToken}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            invoices={invoices}
            inventory={inventory}
            parties={parties}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            apiBaseUrl={apiBaseUrl}
            isOnline={isOnline}
            onSyncOfflineQueue={() => syncQueue(apiBaseUrl, authToken)}
          />
        )}

        {activeTab === 'autoflow' && (
          <AutoFlowCommandCenter
            workflows={workflows}
            onApprove={(id) =>
              setWorkflows((prev) =>
                prev.map((w) => (w.id === id ? { ...w, status: 'APPROVED' } : w))
              )
            }
            onReject={(id) =>
              setWorkflows((prev) =>
                prev.map((w) => (w.id === id ? { ...w, status: 'REJECTED' } : w))
              )
            }
          />
        )}
      </main>

      {/* Bill Capture Modal */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setIsScanModalOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center shadow-lg border border-slate-700"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
            <CaptureStudio
              onScanComplete={handleScanComplete}
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
            />
          </div>
        </div>
      )}

      {/* Split-View Verification Drawer */}
      {isDrawerOpen && (
        <SplitViewVerificationDrawer
          previewUrl={drawerPreviewUrl}
          initialItems={drawerItems}
          initialAnomalies={drawerAnomalies}
          onSave={handleSaveVerifiedBill}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation Dock (Visible on small & medium viewports) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 border-t border-slate-800/90 backdrop-blur-2xl flex items-center justify-around px-2 z-40 max-w-md mx-auto sm:max-w-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'dashboard'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">होम</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'bills'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">बिल</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'inventory'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PackageIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">स्टॉक</span>
        </button>

        <button
          onClick={() => setActiveTab('udhaar')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'udhaar'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpenIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">उधार</span>
        </button>

        <button
          onClick={() => setActiveTab('voice')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'voice'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MicIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">आवाज़</span>
        </button>

        <button
          onClick={() => setActiveTab('gst')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'gst'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheckIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">जीएसटी</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'settings'
              ? 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CogIcon className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">सेटिंग्स</span>
        </button>
      </nav>
    </div>
  );
}
