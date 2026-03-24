import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, Receipt, Tag, X, MoreHorizontal } from 'lucide-react';
import { subscribeToProducts, subscribeToExpenses, addExpense, deleteExpense, updateProduct } from '../services/firestoreService';
import Modal from '../components/Modal';

const ExpenseItem = React.memo(({ item, onUpdateQty, onRemove }) => (
  <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700 rounded-xl shadow-sm">
    <div className="flex-1 min-w-0 mr-2">
      <h4 className="font-semibold text-gray-800 dark:text-white truncate text-sm">{item.name}</h4>
      <div className="text-xs text-gray-500">₱{item.price?.toFixed(2)}</div>
    </div>
    <div className="flex items-center gap-1">
      <button onPointerDown={(e) => { e.preventDefault(); onUpdateQty(item.id, -1); }} className="p-1.5 rounded-lg bg-white dark:bg-gray-600 shadow-sm"><Minus size={12} /></button>
      <span className="font-bold w-6 text-center dark:text-white text-sm">{item.qty}</span>
      <button onPointerDown={(e) => { e.preventDefault(); onUpdateQty(item.id, 1); }} className="p-1.5 rounded-lg bg-white dark:bg-gray-600 shadow-sm"><Plus size={12} /></button>
      <button onPointerDown={(e) => { e.preventDefault(); onRemove(item.id); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg ml-1"><Trash2 size={13} /></button>
    </div>
  </div>
));

export default function Expenses() {
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState('');
  const [manualForm, setManualForm] = useState({ description: '', amount: '' });

  useEffect(() => {
    const unsubProducts = subscribeToProducts((data) => setProducts(data));
    const unsubExpenses = subscribeToExpenses((data) => setExpenses(data));
    return () => { unsubProducts(); unsubExpenses(); };
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    const price = product.sellingPrice ?? product.price;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, price, qty: 1 }];
    });
  };

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = item.qty + delta;
      if (newQty <= 0 || newQty > item.stock) return item;
      return { ...item, qty: newQty };
    }));
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await addExpense({
        description: note || cart.map(i => `${i.name} x${i.qty}`).join(', '),
        amount: total,
        category: 'Store Consumption',
        items: cart.map(i => ({ productId: i.id, name: i.name, price: i.price, qty: i.qty })),
      });
      for (const item of cart) {
        await updateProduct(item.id, { stock: item.stock - item.qty });
      }
      setCart([]);
      setNote('');
      setShowConfirmModal(false);
      setShowCart(false);
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await addExpense({
        description: manualForm.description,
        amount: parseFloat(manualForm.amount),
        category: 'Other',
        items: [],
      });
      setManualForm({ description: '', amount: '' });
      setShowManualModal(false);
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteExpense(selectedExpense.id);
      setShowDeleteModal(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const CartPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-orange-500 to-red-500 shrink-0">
        <div className="flex items-center justify-between text-white mb-1">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} />
            <h2 className="text-base font-bold">Items Taken</h2>
          </div>
          <button onClick={() => setShowCart(false)} className="lg:hidden p-2 hover:bg-white/20 rounded-lg"><X size={20} /></button>
        </div>
        <p className="text-orange-100 text-xs">{cartCount} items</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">
            <ShoppingCart size={44} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No items selected</p>
          </div>
        ) : cart.map(item => (
          <ExpenseItem key={item.id} item={item} onUpdateQty={updateQty} onRemove={removeFromCart} />
        ))}
      </div>

      <div className="p-4 border-t dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white mb-3">
          <span>Total</span>
          <span>₱{total.toFixed(2)}</span>
        </div>
        <button
          onPointerDown={(e) => { e.preventDefault(); if (cart.length > 0) setShowConfirmModal(true); }}
          disabled={cart.length === 0}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <Receipt size={19} />
          Log Expense ₱{total.toFixed(2)}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 overflow-hidden">
      {/* Animated bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-20 -left-10 w-96 h-96 bg-orange-300/25 dark:bg-orange-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute top-1/3 -right-20 w-[28rem] h-[28rem] bg-red-300/20 dark:bg-red-500/10 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-20 left-1/4 w-80 h-80 bg-yellow-300/20 dark:bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      {/* Left — Product Grid */}
      <div className="relative flex-1 flex flex-col p-3 sm:p-4 overflow-hidden min-h-0">
        {/* Header */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="lg:hidden w-10" />
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Store Expenses
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualModal(true)}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-600 dark:text-gray-300 text-xs font-medium flex items-center gap-1"
              >
                <MoreHorizontal size={15} />
                <span className="hidden sm:inline">Manual</span>
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="lg:hidden relative p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg"
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap text-xs ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Tag size={11} className="inline mr-1" />{cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 overflow-y-auto pb-2 flex-1 px-1 content-start">
          {filteredProducts.map(product => {
            const displayPrice = product.sellingPrice ?? product.price;
            const initials = product.name?.slice(0, 2).toUpperCase() || '??';
            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-2.5 rounded-xl cursor-pointer transition-all border-2 flex flex-col ${
                  product.stock <= 0 ? 'border-red-200 opacity-60 cursor-not-allowed' : 'border-transparent hover:border-orange-400 hover:shadow-md'
                } bg-white dark:bg-gray-800 shadow-sm`}
              >
                <div className="h-10 bg-gray-800 rounded-lg mb-1.5 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-base font-black text-orange-400/80 leading-none">{initials}</span>
                  <span className="text-gray-400 text-[9px] text-center px-1 leading-tight truncate w-full text-center">{product.category || '—'}</span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-xs mb-1.5 leading-tight line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between gap-1 mt-auto">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-xs">₱{displayPrice?.toFixed(2)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    product.stock <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    product.stock < 10 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {product.stock <= 0 ? 'Out' : product.stock}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expense History */}
        <div className="mt-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border dark:border-gray-700 max-h-48 overflow-hidden flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 shrink-0">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Expenses</span>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">Total: ₱{totalExpenses.toFixed(2)}</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {expenses.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-4">No expenses yet</p>
            ) : expenses.map(exp => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-2 hover:bg-orange-50/50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{exp.description}</p>
                  <p className="text-[10px] text-gray-400">{exp.createdAt?.toDate().toLocaleString() || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">₱{exp.amount?.toFixed(2)}</span>
                  <button onClick={() => { setSelectedExpense(exp); setShowDeleteModal(true); }} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:flex w-72 xl:w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex-col shadow-2xl min-h-0">
        <CartPanel />
      </div>

      {/* Mobile Cart Drawer */}
      {showCart && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)} />
          <div className="lg:hidden fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 z-50 flex flex-col shadow-2xl">
            <CartPanel />
          </div>
        </>
      )}

      {/* Confirm Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Log Expense">
        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">₱{total.toFixed(2)}</div>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Items:</div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{item.name} x{item.qty}</span>
                <span>₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Note (optional)</label>
            <input
              type="text"
              placeholder="e.g. For store lunch"
              className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-orange-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowConfirmModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={isProcessing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold transition-all disabled:opacity-50">
              {isProcessing ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Expense Modal */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Add Manual Expense">
        <form onSubmit={handleManualAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Electricity bill"
              className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-orange-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={manualForm.description}
              onChange={(e) => setManualForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount (₱)</label>
            <input
              type="number"
              step="0.01"
              required
              inputMode="decimal"
              placeholder="0.00"
              className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-orange-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={manualForm.amount}
              onChange={(e) => setManualForm(f => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowManualModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isProcessing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold transition-all disabled:opacity-50">
              {isProcessing ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Expense" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Delete <span className="font-bold text-gray-800 dark:text-white">{selectedExpense?.description}</span> (₱{selectedExpense?.amount?.toFixed(2)})?
          </p>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={isProcessing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold transition-all disabled:opacity-50">
              {isProcessing ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
