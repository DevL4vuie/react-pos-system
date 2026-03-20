import React, { useState } from 'react';
import { Search, Filter, Download, Eye, ReceiptText } from 'lucide-react';

export default function Sales() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock transaction data - later this will be fetched from Firestore's "transactions" collection
  const [transactions] = useState([
    { id: 'TRX-1042', date: '2026-03-18 14:30', items: 3, total: 149.97, cashier: 'Admin', status: 'Completed' },
    { id: 'TRX-1043', date: '2026-03-18 15:15', items: 1, total: 29.99, cashier: 'Staff', status: 'Completed' },
    { id: 'TRX-1044', date: '2026-03-18 16:45', items: 5, total: 345.50, cashier: 'Admin', status: 'Completed' },
    { id: 'TRX-1045', date: '2026-03-19 09:10', items: 2, total: 89.98, cashier: 'Staff', status: 'Refunded' },
  ]);

  // Filter logic for the search bar
  const filteredTransactions = transactions.filter(trx => 
    trx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trx.cashier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Sales History</h1>
          <p className="text-gray-500">View and manage past transactions and receipts.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <Filter size={18} />
            Filter
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
        
        {/* Search Bar Area */}
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by Transaction ID or Cashier..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Transaction ID</th>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium text-center">Items</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Cashier</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <ReceiptText size={16} className="text-gray-400" />
                      {trx.id}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{trx.date}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 text-center">{trx.items}</td>
                    <td className="p-4 font-semibold text-gray-800 dark:text-white">${trx.total.toFixed(2)}</td>
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
                      <button className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No transactions found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}