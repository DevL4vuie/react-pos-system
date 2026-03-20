import React, { useState } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';

// Mock Data (To be replaced by Firestore real-time listener)
const DUMMY_PRODUCTS = [
  { id: 1, name: 'Wireless Earbuds', price: 59.99, category: 'Electronics', stock: 45 },
  { id: 2, name: 'Ergonomic Mouse', price: 29.99, category: 'Accessories', stock: 12 },
  { id: 3, name: 'Mechanical Keyboard', price: 89.99, category: 'Electronics', stock: 8 },
  { id: 4, name: 'USB-C Hub', price: 45.00, category: 'Accessories', stock: 100 },
];

export default function POS() {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal * 0.08; // 8% mock tax
  const total = subtotal + tax;

  const handleCheckout = () => {
    // TODO: Push transaction to Firestore and generate PDF receipt
    alert(`Checkout complete! Total: $${total.toFixed(2)}`);
    setCart([]);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Main Product Area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Header & Search */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Point of Sale</h1>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
          {DUMMY_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-blue-500"
            >
              <div className="h-32 bg-gradient-to-tr from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-medium">{product.category}</span>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white truncate">{product.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">${product.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">Stock: {product.stock}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col shadow-xl">
        <div className="p-6 border-b dark:border-gray-700 flex items-center gap-2">
          <ShoppingCart className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Current Order</h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 dark:text-white truncate">{item.name}</h4>
                  <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold w-4 text-center dark:text-white">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded ml-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white pt-2 border-t dark:border-gray-700">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard size={24} />
            Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}