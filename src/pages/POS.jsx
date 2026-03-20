import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Tag, X, Scale } from 'lucide-react';
import { subscribeToProducts, addSale, updateProduct } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

// ── All sub-components defined OUTSIDE POS to prevent remount on re-render ──

const CartItem = React.memo(({ item, onUpdateQty, onRemove }) => (
  <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-xl shadow-sm">
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

const GulayRow = React.memo(({ item, idx, isLast, showRemove, onChange, onAdd, onRemove }) => (
  <div className="flex gap-2 mb-2">
    <input
      type="number"
      inputMode="decimal"
      placeholder="Amount"
      value={item.amount}
      onChange={(e) => onChange(idx, e.target.value)}
      className="flex-1 px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
    />
    {isLast && (
      <button onPointerDown={(e) => { e.preventDefault(); onAdd(); }} className="p-2 bg-green-600 text-white rounded-lg"><Plus size={14} /></button>
    )}
    {showRemove && (
      <button onPointerDown={(e) => { e.preventDefault(); onRemove(idx); }} className="p-2 bg-red-500 text-white rounded-lg"><Trash2 size={14} /></button>
    )}
  </div>
));

const CartFooter = React.memo(({ gulayItems, gulayTotal, total, onGulayChange, onGulayAdd, onGulayRemove, onCheckout, disabled }) => (
  <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 border-t dark:border-gray-700 shrink-0">
    <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 mb-2">
        <Scale size={15} className="text-green-600" />
        <span className="font-semibold text-sm text-green-700 dark:text-green-400">Gulay (by kilo)</span>
      </div>
      {gulayItems.map((item, idx) => (
        <GulayRow
          key={idx}
          item={item}
          idx={idx}
          isLast={idx === gulayItems.length - 1}
          showRemove={gulayItems.length > 1}
          onChange={onGulayChange}
          onAdd={onGulayAdd}
          onRemove={onGulayRemove}
        />
      ))}
      {gulayTotal > 0 && (
        <div className="text-right font-bold text-sm text-green-700 dark:text-green-400">
          Gulay: ₱{gulayTotal.toFixed(2)}
        </div>
      )}
    </div>
    <div className="flex justify-between text-xl font-bold text-gray-800 dark:text-white mb-3">
      <span>Total</span>
      <span>₱{total.toFixed(2)}</span>
    </div>
    <button
      onPointerDown={(e) => { e.preventDefault(); onCheckout(); }}
      disabled={disabled}
      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
    >
      <CreditCard size={19} />
      Charge ₱{total.toFixed(2)}
    </button>
  </div>
));

const CartList = React.memo(({ cart, onUpdateQty, onRemove }) => (
  <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
    {cart.length === 0 ? (
      <div className="text-center text-gray-400 mt-16">
        <ShoppingCart size={44} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Cart is empty</p>
      </div>
    ) : (
      cart.map(item => (
        <CartItem key={item.id} item={item} onUpdateQty={onUpdateQty} onRemove={onRemove} />
      ))
    )}
  </div>
));

// ── Main POS component ──
export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [gulayItems, setGulayItems] = useState([{ amount: '' }]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => setProducts(data));
    return () => unsubscribe();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    const price = product.sellingPrice ?? product.price;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
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
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleGulayChange = useCallback((idx, value) => {
    setGulayItems(prev => prev.map((item, i) => i === idx ? { amount: value } : item));
  }, []);

  const addGulayRow = useCallback(() => setGulayItems(prev => [...prev, { amount: '' }]), []);
  const removeGulayRow = useCallback((idx) => setGulayItems(prev => prev.filter((_, i) => i !== idx)), []);

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gulayTotal = gulayItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const total = cartSubtotal + gulayTotal;
  const change = amountPaid ? (parseFloat(amountPaid) - total).toFixed(2) : '0.00';
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = async () => {
    if (parseFloat(amountPaid) < total) return;
    setIsProcessing(true);
    try {
      await addSale({
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice ?? item.price,
          qty: item.qty,
          category: item.category
        })),
        gulayItems: gulayItems.filter(g => g.amount).map(g => ({ amount: parseFloat(g.amount) })),
        gulayTotal,
        total,
        amountPaid: parseFloat(amountPaid),
        change: parseFloat(change),
        cashier: currentUser?.email || 'Unknown',
        status: 'Completed'
      });
      for (const item of cart) {
        await updateProduct(item.id, { stock: item.stock - item.qty });
      }
      setCart([]);
      setGulayItems([{ amount: '' }]);
      setAmountPaid('');
      setShowCheckoutModal(false);
      setShowCart(false);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
    setIsProcessing(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartFooterProps = {
    gulayItems,
    gulayTotal,
    total,
    onGulayChange: handleGulayChange,
    onGulayAdd: addGulayRow,
    onGulayRemove: removeGulayRow,
    onCheckout: () => setShowCheckoutModal(true),
    disabled: cart.length === 0 && gulayTotal === 0
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 overflow-hidden">
      {/* Animated bg */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-20 -left-10 w-96 h-96 bg-blue-300/25 dark:bg-blue-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute top-1/3 -right-20 w-[28rem] h-[28rem] bg-orange-300/25 dark:bg-orange-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-20 left-1/4 w-80 h-80 bg-purple-300/25 dark:bg-purple-500/15 rounded-full blur-3xl" />
        <div className="animate-float-up absolute top-[18%] left-[6%] w-10 h-10 rounded-full bg-blue-400/30" />
        <div className="animate-float-up animation-delay-2000 absolute top-[45%] right-[6%] w-8 h-8 rotate-45 bg-orange-400/30" />
        <div className="animate-spin-slow absolute bottom-[28%] left-[12%] w-12 h-12 border-2 border-purple-400/30 rounded-sm" />
        <div className="animate-float-side animation-delay-3000 absolute bottom-[12%] right-[18%] w-9 h-9 rounded-full bg-yellow-400/25" />
      </div>

      {/* Main Product Area */}
      <div className="relative flex-1 flex flex-col p-3 sm:p-4 overflow-hidden min-h-0">
        {/* Header */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="lg:hidden w-10" />
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              Point of Sale
            </h1>
            <button
              onClick={() => setShowCart(true)}
              className="lg:hidden relative p-2 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl shadow-lg"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <div className="hidden lg:block w-10" />
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm"
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
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Tag size={11} className="inline mr-1" />{cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid — smaller cards */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 overflow-y-auto pb-2 flex-1">
          {filteredProducts.map(product => {
            const displayPrice = product.sellingPrice ?? product.price;
            const initials = product.name?.slice(0, 2).toUpperCase() || '??';
            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`p-2 rounded-xl cursor-pointer transition-all border-2 ${
                  product.stock <= 0 ? 'border-red-200 opacity-50 cursor-not-allowed' : 'border-transparent hover:border-orange-400'
                }`}
              >
                <div className="h-14 sm:h-16 bg-gray-800 rounded-lg mb-1.5 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-lg sm:text-xl font-black text-blue-400/80 leading-none">{initials}</span>
                  <span className="text-gray-400 text-[10px] text-center px-1 leading-tight truncate w-full text-center">{product.category || '—'}</span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white truncate text-xs mb-1">{product.name}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">₱{displayPrice?.toFixed(2)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    product.stock <= 0 ? 'bg-red-100 text-red-600' :
                    product.stock < 10 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {product.stock <= 0 ? 'Out' : product.stock}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:flex w-72 xl:w-80 bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex-col shadow-2xl min-h-0">
        <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-orange-500 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart size={20} />
            <h2 className="text-base font-bold">Current Order</h2>
          </div>
          <p className="text-blue-100 text-xs mt-0.5">{cartCount} items</p>
        </div>
        <CartList cart={cart} onUpdateQty={updateQty} onRemove={removeFromCart} />
        <CartFooter {...cartFooterProps} />
      </div>

      {/* Mobile Cart Drawer */}
      {showCart && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)} />
          <div className="lg:hidden fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 z-50 flex flex-col shadow-2xl">
            <div className="p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-orange-500 shrink-0">
              <div className="flex items-center justify-between text-white mb-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  <h2 className="text-base font-bold">Current Order</h2>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <p className="text-blue-100 text-xs">{cartCount} items</p>
            </div>
            <CartList cart={cart} onUpdateQty={updateQty} onRemove={removeFromCart} />
            <CartFooter {...cartFooterProps} />
          </div>
        </>
      )}

      {/* Checkout Modal */}
      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Confirm Checkout">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">₱{total.toFixed(2)}</div>
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Summary:</div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{item.name} x{item.qty}</span>
                <span>₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            {gulayTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-semibold">
                <span>Gulay</span><span>₱{gulayTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Paid</label>
            <input
              type="number"
              inputMode="decimal"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg font-semibold"
            />
          </div>
          {amountPaid && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Change</div>
              <div className={`text-2xl font-bold ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₱{change}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || !amountPaid || parseFloat(amountPaid) < total}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
