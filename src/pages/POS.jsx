import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Tag, DollarSign, X, Scale } from 'lucide-react';
import { subscribeToProducts, addSale, updateProduct } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [priceSearch, setPriceSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  const [gulayItems, setGulayItems] = useState([{ amount: '' }]);
  const { currentUser } = useAuth();

  // Real-time products listener
  useEffect(() => {
    const unsubscribe = subscribeToProducts((productsData) => {
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return;
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        if (newQty <= 0) return item;
        if (newQty > item.stock) return item;
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const gulayTotal = gulayItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const total = cartSubtotal + gulayTotal;
  const change = amountPaid ? (parseFloat(amountPaid) - total).toFixed(2) : '0.00';

  const handleCheckout = async () => {
    if (parseFloat(amountPaid) < total) return;
    setIsProcessing(true);
    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
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
      };
      
      await addSale(saleData);

      for (const item of cart) {
        await updateProduct(item.id, {
          stock: item.stock - item.qty
        });
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

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesPrice = !priceSearch || p.price.toString().includes(priceSearch);
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Main Product Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Header & Search */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Point of Sale</h1>
            
            {/* Mobile Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="lg:hidden relative p-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl shadow-lg"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-48">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by price" 
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white shadow-sm"
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Tag size={14} className="inline mr-1 sm:mr-2" />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-y-auto pb-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className={`bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl shadow-sm hover:shadow-xl cursor-pointer transition-all border-2 ${
                product.stock <= 0 
                  ? 'border-red-200 opacity-50 cursor-not-allowed' 
                  : 'border-transparent hover:border-orange-400'
              }`}
            >
              <div className="h-24 sm:h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-400 font-semibold text-xs sm:text-sm text-center px-2">{product.category || 'Uncategorized'}</span>
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white truncate mb-1 text-sm sm:text-base">{product.name}</h3>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-base sm:text-lg">₱{product.price?.toFixed(2)}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.stock <= 0 ? 'bg-red-100 text-red-600' :
                  product.stock < 10 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {product.stock <= 0 ? 'Out' : `${product.stock}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className="hidden lg:flex w-96 bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex-col shadow-2xl">
        <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-orange-500">
          <div className="flex items-center gap-2 text-white">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-bold">Current Order</h2>
          </div>
          <p className="text-blue-100 text-sm mt-1">{cart.length} items in cart</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-xl shadow-sm">
                <div className="flex-1 min-w-0 mr-2">
                  <h4 className="font-semibold text-gray-800 dark:text-white truncate">{item.name}</h4>
                  <div className="text-sm text-gray-500">₱{item.price?.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1.5 rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 shadow-sm">
                    <Minus size={14} />
                  </button>
                  <span className="font-bold w-8 text-center dark:text-white">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1.5 rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 shadow-sm">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg ml-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 border-t dark:border-gray-700">
          {/* Gulay Section */}
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-3">
              <Scale size={18} className="text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400">Gulay (by kilo)</span>
            </div>
            {gulayItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={item.amount}
                  onChange={(e) => {
                    const newItems = [...gulayItems];
                    newItems[idx].amount = e.target.value;
                    setGulayItems(newItems);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {idx === gulayItems.length - 1 && (
                  <button
                    onClick={() => setGulayItems([...gulayItems, { amount: '' }])}
                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus size={18} />
                  </button>
                )}
                {gulayItems.length > 1 && (
                  <button
                    onClick={() => setGulayItems(gulayItems.filter((_, i) => i !== idx))}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            {gulayTotal > 0 && (
              <div className="text-right font-bold text-green-700 dark:text-green-400 mt-2">
                Gulay Total: ₱{gulayTotal.toFixed(2)}
              </div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-2xl font-bold text-gray-800 dark:text-white">
              <span>Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0 && gulayTotal === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold text-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <CreditCard size={24} />
            Charge ₱{total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Mobile Cart Drawer */}
      {showCart && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowCart(false)}
          />
          <div className="lg:hidden fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-gray-800 z-50 flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-orange-500">
              <div className="flex items-center justify-between text-white mb-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={24} />
                  <h2 className="text-xl font-bold">Current Order</h2>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <p className="text-blue-100 text-sm">{cart.length} items in cart</p>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 rounded-xl shadow-sm">
                    <div className="flex-1 min-w-0 mr-2">
                      <h4 className="font-semibold text-gray-800 dark:text-white truncate text-sm sm:text-base">{item.name}</h4>
                      <div className="text-xs sm:text-sm text-gray-500">₱{item.price?.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1.5 rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 shadow-sm">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-6 sm:w-8 text-center dark:text-white text-sm sm:text-base">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1.5 rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 shadow-sm">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg ml-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Checkout Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-900 border-t dark:border-gray-700">
              {/* Gulay Section */}
              <div className="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <Scale size={16} className="text-green-600" />
                  <span className="font-semibold text-sm text-green-700 dark:text-green-400">Gulay (by kilo)</span>
                </div>
                {gulayItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...gulayItems];
                        newItems[idx].amount = e.target.value;
                        setGulayItems(newItems);
                      }}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {idx === gulayItems.length - 1 && (
                      <button
                        onClick={() => setGulayItems([...gulayItems, { amount: '' }])}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                    {gulayItems.length > 1 && (
                      <button
                        onClick={() => setGulayItems(gulayItems.filter((_, i) => i !== idx))}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {gulayTotal > 0 && (
                  <div className="text-right font-bold text-sm text-green-700 dark:text-green-400 mt-2">
                    Gulay Total: ₱{gulayTotal.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                  <span>Total</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowCheckoutModal(true)}
                disabled={cart.length === 0 && gulayTotal === 0}
                className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold text-base sm:text-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                <CreditCard size={20} />
                Charge ₱{total.toFixed(2)}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Checkout Confirmation Modal */}
      <Modal isOpen={showCheckoutModal} onClose={() => setShowCheckoutModal(false)} title="Confirm Checkout">
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Amount</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">₱{total.toFixed(2)}</div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Order Summary:</div>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{item.name} x{item.qty}</span>
                <span>₱{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
            {gulayTotal > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-semibold">
                <span>Gulay (by kilo)</span>
                <span>₱{gulayTotal.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Paid</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg font-semibold"
              />
            </div>
            {amountPaid && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">Change</div>
                <div className={`text-2xl font-bold ${parseFloat(change) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ₱{change}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || !amountPaid || parseFloat(amountPaid) < total}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
