import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, ReceiptText, Scale } from 'lucide-react';
import { subscribeToSales } from '../services/firestoreService';
import Modal from '../components/Modal';

function shortId(id) {
  if (!id) return '---';
  const nums = id.replace(/\D/g, '').slice(0, 3).padStart(3, '0');
  const letters = id.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
  return `${nums}${letters}`;
}

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToSales((salesData) => {
      setTransactions(salesData.map(sale => ({
        ...sale,
        shortId: shortId(sale.id),
        date: sale.createdAt?.toDate().toLocaleString() || 'N/A',
        itemCount: sale.items?.length || 0
      })));
    });
    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter(trx =>
    trx.shortId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trx.cashier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Items', 'Total', 'Cashier', 'Status'];
    const rows = transactions.map(trx => [trx.shortId, trx.date, trx.itemCount, trx.total?.toFixed(2), trx.cashier, trx.status]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-900 min-h-screen overflow-hidden">
      {/* Animated bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-16 -right-16 w-96 h-96 bg-blue-300/25 dark:bg-blue-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute -bottom-16 -left-10 w-[28rem] h-[28rem] bg-orange-300/25 dark:bg-orange-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/2 w-80 h-80 bg-yellow-300/20 dark:bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="animate-float-up absolute top-[20%] left-[8%] w-10 h-10 rounded-full bg-blue-400/25" />
        <div className="animate-spin-slow absolute bottom-[30%] right-[10%] w-12 h-12 border-2 border-orange-400/25 rounded-sm" />
        <div className="animate-float-side animation-delay-2000 absolute top-[55%] left-[30%] w-9 h-9 rotate-45 bg-yellow-400/20" />
      </div>

      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div className="text-right flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Sales History</h1>
          <p className="text-gray-500 text-sm sm:text-base">View and manage past transactions.</p>
        </div>
        <button onClick={exportToCSV}
          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg text-sm">
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
        <div className="p-3 sm:p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={17} />
            <input type="text" placeholder="Search by ID or Cashier..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-900/50 dark:to-gray-900/50 text-gray-600 dark:text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3 sm:p-4 font-semibold">ID</th>
                <th className="p-3 sm:p-4 font-semibold">Date & Time</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Items</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Gulay</th>
                <th className="p-3 sm:p-4 font-semibold">Total</th>
                <th className="p-3 sm:p-4 font-semibold hidden sm:table-cell">Cashier</th>
                <th className="p-3 sm:p-4 font-semibold">Status</th>
                <th className="p-3 sm:p-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => { setSelectedTransaction(trx); setShowReceiptModal(true); }}>
                    <td className="p-3 sm:p-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <ReceiptText size={14} className="text-gray-400 shrink-0" />
                        {trx.shortId}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{trx.date}</td>
                    <td className="p-3 sm:p-4 text-center font-semibold text-sm">{trx.itemCount}</td>
                    <td className="p-3 sm:p-4 text-center">
                      {trx.gulayTotal > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                          <Scale size={11} />₱{trx.gulayTotal.toFixed(2)}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-gray-800 dark:text-white text-sm">₱{trx.total?.toFixed(2)}</td>
                    <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-300 text-sm hidden sm:table-cell">{trx.cashier}</td>
                    <td className="p-3 sm:p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trx.status === 'Completed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>{trx.status}</span>
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedTransaction(trx); setShowReceiptModal(true); }}
                        className="text-gray-500 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 text-sm">
                    {searchTerm ? `No transactions found matching "${searchTerm}"` : 'No transactions yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Transaction Receipt" size="lg">
        {selectedTransaction && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 p-5 rounded-xl">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Gemma & Leo Store</h3>
                <p className="text-sm text-gray-500">Transaction Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <p className="font-bold text-gray-800 dark:text-white font-mono">{selectedTransaction.shortId}</p>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.date}</p>
                </div>
                <div>
                  <span className="text-gray-500">Cashier:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.cashier}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="font-semibold text-green-600">{selectedTransaction.status}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Items Purchased</h4>
              <div className="space-y-2">
                {selectedTransaction.items?.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.qty} × ₱{item.price?.toFixed(2)}</p>
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white text-sm">₱{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
                {selectedTransaction.gulayTotal > 0 && (
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Scale size={15} className="text-green-600" />
                      <p className="font-medium text-green-700 dark:text-green-400 text-sm">Gulay (by kilo)</p>
                    </div>
                    <p className="font-bold text-green-700 dark:text-green-400 text-sm">₱{selectedTransaction.gulayTotal.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t dark:border-gray-600 pt-4 space-y-2">
              <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white">
                <span>Total:</span><span>₱{selectedTransaction.total?.toFixed(2)}</span>
              </div>
              {selectedTransaction.amountPaid && (
                <>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Amount Paid:</span><span>₱{selectedTransaction.amountPaid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-600 dark:text-green-400">
                    <span>Change:</span><span>₱{selectedTransaction.change?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <button onClick={() => window.print()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold transition-all">
              Print Receipt
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
