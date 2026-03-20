import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  // Mock data - later we fetch this from Firestore
  const [products, setProducts] = useState([
    { id: '1', name: 'Wireless Earbuds', category: 'Electronics', price: 59.99, stock: 45 },
    { id: '2', name: 'Ergonomic Mouse', category: 'Accessories', price: 29.99, stock: 12 },
  ]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory</h1>
          <p className="text-gray-500">Manage your products and stock levels.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Product Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 font-medium text-gray-800 dark:text-white">{product.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-xs">{product.category}</span>
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">${product.price.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`font-medium ${product.stock < 15 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-3">
                    <button className="text-blue-500 hover:text-blue-700 p-1"><Edit size={18} /></button>
                    <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}