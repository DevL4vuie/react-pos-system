import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, ReceiptText, Scale } from 'lucide-react';
import { subscribeToSales } from '../services/firestoreService';
import Modal from '../components/Modal';

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Real-time sales listener
  useEffect(() => {
    const unsubscribe = subscribeToSales((salesData) => {
      const formattedSales = salesData.map(sale => ({
        ...sale,
        date: sale.createdAt?.toDate().toLocaleString() || 'N/A',
        itemCount: sale.items?.length || 0
      }));
      setTransactions(formattedSales);
    });
    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter(trx => 
    trx.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trx.cashier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewReceipt = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Items', 'Total', 'Cashier', 'Status'];
    const rows = transactions.map(trx => [
      trx.id,
      trx.date,
      trx.itemCount,
      trx.total?.toFixed(2),
      trx.cashier,
      trx.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-900 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Sales History</h1>
          <p className="text-gray-500">View and manage past transactions and receipts.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
            <Filter size={18} />
            Filter
          </button>
          <button 
            onClick={exportToCSV}
            className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-800">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Transaction ID or Cashier..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-900/50 dark:to-gray-900/50 text-gray-600 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Transaction ID</th>
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold text-center">Items</th>
                <th className="p-4 font-semibold text-center">Gulay</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold">Cashier</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => viewReceipt(trx)}>
                    <td className="p-4 font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <ReceiptText size={16} className="text-gray-400" />
                      {trx.id}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{trx.date}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 text-center font-semibold">{trx.itemCount}</td>
                    <td className="p-4 text-center">
                      {trx.gulayTotal > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                          <Scale size={12} />
                          ₱{trx.gulayTotal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-800 dark:text-white">₱{trx.total?.toFixed(2)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{trx.cashier}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trx.status === 'Completed' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {trx.status}
                      </span>
                    </td>
                    <td className="p-4 flex justify-end">
                      <button 
                        onClick={(e) => { e.stopPropagation(); viewReceipt(trx); }}
                        className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? `No transactions found matching "${searchTerm}"` : 'No transactions yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={showReceiptModal} onClose={() => setShowReceiptModal(false)} title="Transaction Receipt" size="lg">
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-xl">
              <div className="text-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">QuickPOS</h3>
                <p className="text-sm text-gray-500">Transaction Receipt</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedTransaction.id}</p>
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
                {selectedTransaction.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.qty} × ₱{item.price?.toFixed(2)}</p>
                    </div>
                    <p className="font-bold text-gray-800 dark:text-white">₱{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
                {selectedTransaction.gulayTotal > 0 && (
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-green-600" />
                      <p className="font-medium text-green-700 dark:text-green-400">Gulay (by kilo)</p>
                    </div>
                    <p className="font-bold text-green-700 dark:text-green-400">₱{selectedTransaction.gulayTotal.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t dark:border-gray-600 pt-4 space-y-2">
              <div className="flex justify-between text-2xl font-bold text-gray-800 dark:text-white">
                <span>Total:</span>
                <span>₱{selectedTransaction.total?.toFixed(2)}</span>
              </div>
              {selectedTransaction.amountPaid && (
                <>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Amount Paid:</span>
                    <span>₱{selectedTransaction.amountPaid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-green-600 dark:text-green-400">
                    <span>Change:</span>
                    <span>₱{selectedTransaction.change?.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold transition-all"
            >
              Print Receipt
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}