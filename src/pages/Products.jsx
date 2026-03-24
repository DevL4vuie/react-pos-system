import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, FolderOpen, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct, subscribeToCategories, addCategory, updateCategory, deleteCategory } from '../services/firestoreService';
import Modal from '../components/Modal';

const emptyForm = { name: '', category: '', originalPrice: '', sellingPrice: '', stock: '', minStock: '', maxStock: '', byKilo: false, stockUnit: 'pcs' };

// Defined OUTSIDE to prevent remount on every keystroke
const ProductForm = React.memo(({ formData, setFormData, categories, onSubmit, onCancel, isSubmitting, submitLabel }) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Name</label>
      <input
        type="text"
        required
        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        value={formData.name}
        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
      <select
        required
        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        value={formData.category}
        onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
      >
        <option value="">Select a category</option>
        {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Price (₱)</label>
        <input
          type="number"
          step="0.01"
          required
          inputMode="decimal"
          className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.originalPrice}
          onChange={(e) => setFormData(f => ({ ...f, originalPrice: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selling Price (₱)</label>
        {formData.byKilo ? (
          <div className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 text-sm text-gray-400 dark:text-gray-500 italic">
            Set per transaction
          </div>
        ) : (
          <input
            type="number"
            step="0.01"
            required
            inputMode="decimal"
            className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.sellingPrice}
            onChange={(e) => setFormData(f => ({ ...f, sellingPrice: e.target.value }))}
          />
        )}
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Stock</label>
      <div className="flex gap-2">
        <input
          type="number"
          required
          inputMode="numeric"
          className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.stock}
          onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))}
        />
        <select
          className="px-3 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          value={formData.stockUnit}
          onChange={(e) => setFormData(f => ({ ...f, stockUnit: e.target.value }))}
        >
          <option value="pcs">pcs</option>
          <option value="kilo">kilo</option>
          <option value="pack">pack</option>
          <option value="box">box</option>
          <option value="bottle">bottle</option>
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Stock (Alert)</label>
        <input
          type="number"
          placeholder="Optional"
          inputMode="numeric"
          className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.minStock}
          onChange={(e) => setFormData(f => ({ ...f, minStock: e.target.value }))}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Stock</label>
        <input
          type="number"
          placeholder="Optional"
          inputMode="numeric"
          className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.maxStock}
          onChange={(e) => setFormData(f => ({ ...f, maxStock: e.target.value }))}
        />
      </div>
    </div>
    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sold by Kilo</p>
        <p className="text-xs text-gray-500">Price will be entered per transaction in POS</p>
      </div>
      <button
        type="button"
        onClick={() => setFormData(f => ({ ...f, byKilo: !f.byKilo, sellingPrice: !f.byKilo ? '' : f.sellingPrice }))}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          formData.byKilo ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          formData.byKilo ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold transition-all disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </div>
  </form>
));

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showInStockModal, setShowInStockModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [restockQtys, setRestockQtys] = useState({});
  const [restockingId, setRestockingId] = useState(null);

  const handleRestock = async (product) => {
    const qty = parseInt(restockQtys[product.id]);
    if (!qty || qty <= 0) return;
    setRestockingId(product.id);
    try {
      await updateProduct(product.id, { stock: product.stock + qty });
      setRestockQtys(prev => ({ ...prev, [product.id]: '' }));
    } catch (e) { console.error(e); }
    setRestockingId(null);
  };

  useEffect(() => {
    const unsubscribe = subscribeToProducts((data) => setProducts(data));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCategories((data) => setCategories(data));
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addProduct({
        name: formData.name,
        category: formData.category,
        originalPrice: parseFloat(formData.originalPrice),
        sellingPrice: formData.byKilo ? 0 : parseFloat(formData.sellingPrice),
        stock: parseInt(formData.stock),
        stockUnit: formData.stockUnit || 'pcs',
        minStock: formData.minStock ? parseInt(formData.minStock) : null,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
        byKilo: formData.byKilo
      });
      setShowAddModal(false);
      setFormData(emptyForm);
    } catch (error) {
      console.error('Error adding product:', error);
    }
    setIsSubmitting(false);
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProduct(selectedProduct.id, {
        name: formData.name,
        category: formData.category,
        originalPrice: parseFloat(formData.originalPrice),
        sellingPrice: formData.byKilo ? 0 : parseFloat(formData.sellingPrice),
        stock: parseInt(formData.stock),
        stockUnit: formData.stockUnit || 'pcs',
        minStock: formData.minStock ? parseInt(formData.minStock) : null,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null,
        byKilo: formData.byKilo
      });
      setShowEditModal(false);
      setSelectedProduct(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error('Error updating product:', error);
    }
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async () => {
    setIsSubmitting(true);
    try {
      await deleteProduct(selectedProduct.id);
      setShowDeleteModal(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
    setIsSubmitting(false);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addCategory({ name: categoryFormData.name });
      setCategoryFormData({ name: '' });
      setEditingCategory(null);
    } catch (error) {
      console.error('Error adding category:', error);
    }
    setIsSubmitting(false);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCategory(editingCategory.id, { name: categoryFormData.name });
      setCategoryFormData({ name: '' });
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async () => {
    setIsSubmitting(true);
    try {
      await deleteCategory(selectedCategory.id);
      setShowCategoryDeleteModal(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
    setIsSubmitting(false);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      originalPrice: (product.originalPrice ?? product.price ?? '').toString(),
      sellingPrice: (product.sellingPrice ?? product.price ?? '').toString(),
      stock: product.stock.toString(),
      stockUnit: product.stockUnit || 'pcs',
      minStock: product.minStock?.toString() || '',
      maxStock: product.maxStock?.toString() || '',
      byKilo: product.byKilo || false
    });
    setShowEditModal(true);
  };

  const allCategories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-900 min-h-screen overflow-hidden">
      {/* Animated background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute -top-16 -left-16 w-96 h-96 bg-blue-300/25 dark:bg-blue-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute top-20 -right-16 w-[28rem] h-[28rem] bg-orange-300/25 dark:bg-orange-500/15 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-16 left-1/3 w-80 h-80 bg-yellow-300/25 dark:bg-yellow-500/15 rounded-full blur-3xl" />
        <div className="animate-float-up absolute top-[15%] right-[8%] w-10 h-10 rounded-full bg-blue-400/25" />
        <div className="animate-float-up animation-delay-2000 absolute top-[50%] left-[5%] w-8 h-8 rotate-45 bg-orange-400/25" />
        <div className="animate-spin-slow absolute bottom-[25%] right-[12%] w-12 h-12 border-2 border-yellow-400/25 rounded-sm" />
        <div className="animate-float-side animation-delay-1000 absolute bottom-[10%] left-[22%] w-9 h-9 rounded-full bg-pink-400/20" />
      </div>

      <div className="relative flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="text-right flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Inventory</h1>
          <p className="text-sm sm:text-base text-gray-500">Manage your products and stock levels.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex-1 sm:flex-none bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg text-sm sm:text-base"
          >
            <FolderOpen size={18} />
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Categories</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg text-sm sm:text-base"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
        <div className="p-3 sm:p-4 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search inventory..."
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 shrink-0">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap text-xs transition-all ${
                    categoryFilter === cat
                      ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Monitoring Section */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border-b dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div
              onClick={() => setShowInStockModal(true)}
              className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border dark:border-gray-600 cursor-pointer hover:shadow-md transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Package className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">In Stock</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {products.filter(p => p.stock > 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setShowLowStockModal(true)}
              className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border dark:border-gray-600 cursor-pointer hover:shadow-md transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {products.filter(p => p.minStock && p.stock <= p.minStock).length}
                  </p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setShowOutOfStockModal(true)}
              className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border dark:border-gray-600 cursor-pointer hover:shadow-md transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Out of Stock</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {products.filter(p => p.stock <= 0).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-sm border dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    ₱{products.reduce((sum, p) => sum + ((p.sellingPrice ?? p.price) * p.stock || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {products.filter(p => p.minStock && p.stock <= p.minStock).length > 0 && (
            <div className="text-center">
              <button
                onClick={() => setShowLowStockModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md"
              >
                ⚠️ View Low Stock Items ({products.filter(p => p.minStock && p.stock <= p.minStock).length})
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-900/50 dark:to-gray-900/50 text-gray-600 dark:text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3 sm:p-4 font-semibold w-[26%]">Product Name</th>
                <th className="p-3 sm:p-4 font-semibold w-[17%]">Category</th>
                <th className="p-3 sm:p-4 font-semibold w-[13%]">Cost</th>
                <th className="p-3 sm:p-4 font-semibold w-[14%]">Selling</th>
                <th className="p-3 sm:p-4 font-semibold text-center w-[14%]">Stock</th>
                <th className="p-3 sm:p-4 font-semibold text-center w-[10%]">Min/Max</th>
                <th className="p-3 sm:p-4 font-semibold text-right w-[6%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isLowStock = product.minStock && product.stock <= product.minStock;
                  const selling = product.sellingPrice ?? product.price;
                  const original = product.originalPrice ?? product.price;
                  return (
                    <tr key={product.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => openEditModal(product)}>
                      <td className="p-3 sm:p-4 font-medium text-gray-800 dark:text-white text-sm truncate max-w-0">{product.name}</td>
                      <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-300">
                        <span className="bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30 px-2 py-1 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-gray-500 dark:text-gray-400 text-sm">₱{original?.toFixed(2)}</td>
                      <td className="p-3 sm:p-4 text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {product.byKilo ? (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">Per kilo</span>
                        ) : <>₱{selling?.toFixed(2)}</>}
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className={`font-bold text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                          product.stock <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          isLowStock ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {product.stock} {product.stockUnit || 'pcs'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                        {product.minStock || '-'} / {product.maxStock || '-'}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                            className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                            <Edit size={15} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setShowDeleteModal(true); }}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y dark:divide-gray-700">
          {filteredProducts.length > 0 ? filteredProducts.map((product) => {
            const isLowStock = product.minStock && product.stock <= product.minStock;
            const selling = product.sellingPrice ?? product.price;
            const original = product.originalPrice ?? product.price;
            return (
              <div key={product.id} className="p-3 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors" onClick={() => openEditModal(product)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{product.name}</p>
                    <span className="inline-block mt-0.5 bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                      className="text-blue-500 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                      <Edit size={15} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setShowDeleteModal(true); }}
                      className="text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-gray-500">Cost: <span className="font-medium text-gray-700 dark:text-gray-300">₱{original?.toFixed(2)}</span></span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-xs text-gray-500">Sell: <span className="font-bold text-blue-600 dark:text-blue-400">
                    {product.byKilo ? 'Per kilo' : `₱${selling?.toFixed(2)}`}
                  </span></span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    product.stock <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    isLowStock ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {product.stock} {product.stockUnit || 'pcs'}
                  </span>
                  {(product.minStock || product.maxStock) && (
                    <span className="text-xs text-gray-400">min/max: {product.minStock || '-'}/{product.maxStock || '-'}</span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="p-8 text-center text-gray-500">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setFormData(emptyForm); }} title="Add New Product">
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onSubmit={handleAddProduct}
          onCancel={() => { setShowAddModal(false); setFormData(emptyForm); }}
          isSubmitting={isSubmitting}
          submitLabel="Add Product"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setFormData(emptyForm); }} title="Edit Product">
        <ProductForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          onSubmit={handleEditProduct}
          onCancel={() => { setShowEditModal(false); setFormData(emptyForm); }}
          isSubmitting={isSubmitting}
          submitLabel="Update Product"
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Product" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">{selectedProduct?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setShowDeleteModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleDeleteProduct} disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold transition-all disabled:opacity-50">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal isOpen={showCategoryModal} onClose={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryFormData({ name: '' }); setCategorySearch(''); }} title="Manage Categories">
        <div className="space-y-4">
          <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Category name"
              className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ name: e.target.value })}
            />
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium transition-all disabled:opacity-50">
              {isSubmitting ? '...' : editingCategory ? 'Update' : 'Add'}
            </button>
            {editingCategory && (
              <button type="button" onClick={() => { setEditingCategory(null); setCategoryFormData({ name: '' }); }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            )}
          </form>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border focus:ring-2 focus:ring-purple-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {categories.length > 0 ? categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-gray-800 dark:text-white font-medium">{cat.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCategory(cat); setCategoryFormData({ name: cat.name }); }}
                    className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => { setSelectedCategory(cat); setShowCategoryDeleteModal(true); }}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )) : <p className="text-center text-gray-500 py-4">No categories yet</p>}
          </div>
        </div>
      </Modal>

      {/* Delete Category Modal */}
      <Modal isOpen={showCategoryDeleteModal} onClose={() => setShowCategoryDeleteModal(false)} title="Delete Category" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <span className="font-bold text-gray-800 dark:text-white">{selectedCategory?.name}</span>?
          </p>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setShowCategoryDeleteModal(false)}
              className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleDeleteCategory} disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold transition-all disabled:opacity-50">
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Low Stock Modal */}
      <Modal isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)} title="Low Stock — Quick Restock" size="lg">
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 flex items-center gap-2">
            <AlertTriangle className="text-yellow-600 shrink-0" size={18} />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Enter how many to add for each item and hit <span className="font-bold">+Add</span>. Out of stock items cannot be restocked here.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Filter items..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border focus:ring-2 focus:ring-yellow-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={restockQtys.__search || ''}
              onChange={(e) => setRestockQtys(prev => ({ ...prev, __search: e.target.value }))}
            />
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {products
              .filter(p => p.minStock && p.stock <= p.minStock)
              .filter(p => p.name.toLowerCase().includes((restockQtys.__search || '').toLowerCase()))
              .map((product) => {
                const outOfStock = product.stock <= 0;
                return (
                  <div key={product.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                    outOfStock
                      ? 'bg-gray-50 dark:bg-gray-700/40 border-gray-200 dark:border-gray-600 opacity-60'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        <span className={`font-bold ${outOfStock ? 'text-gray-400' : 'text-red-600 dark:text-red-400'}`}>{product.stock}</span>
                        <span className="text-gray-400"> / min {product.minStock} {product.stockUnit || 'pcs'}</span>
                        {outOfStock && <span className="ml-1 text-gray-400 italic">(out of stock)</span>}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      placeholder="Qty"
                      disabled={outOfStock}
                      className="w-20 px-2 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-yellow-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center disabled:opacity-40 disabled:cursor-not-allowed"
                      value={restockQtys[product.id] || ''}
                      onChange={(e) => setRestockQtys(prev => ({ ...prev, [product.id]: e.target.value }))}
                      onKeyDown={(e) => !outOfStock && e.key === 'Enter' && handleRestock(product)}
                    />
                    <button
                      onClick={() => handleRestock(product)}
                      disabled={outOfStock || !restockQtys[product.id] || restockingId === product.id}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {restockingId === product.id ? '...' : '+ Add'}
                    </button>
                  </div>
                );
              })}
            {products.filter(p => p.minStock && p.stock <= p.minStock).length === 0 && (
              <p className="text-center text-gray-500 py-6">No low stock items 🎉</p>
            )}
          </div>
          <button onClick={() => { setShowLowStockModal(false); setRestockQtys({}); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold transition-all hover:from-blue-700 hover:to-orange-600">
            Done
          </button>
        </div>
      </Modal>

      {/* In Stock Modal */}
      <Modal isOpen={showInStockModal} onClose={() => setShowInStockModal(false)} title="In Stock Items" size="lg">
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Package className="text-green-600" size={20} />
              <span className="font-semibold text-green-700 dark:text-green-400">Available Products</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              These products are currently in stock and available for sale.
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.filter(p => p.stock > 0).map((product) => (
              <div key={product.id} className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 dark:text-white">{product.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500">Stock:</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">{product.stock}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Selling: ₱{(product.sellingPrice ?? product.price)?.toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Value: ₱{((product.sellingPrice ?? product.price) * product.stock)?.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <button
              onClick={() => setShowInStockModal(false)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-bold transition-all hover:from-green-700 hover:to-green-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Out of Stock Modal */}
      <Modal isOpen={showOutOfStockModal} onClose={() => { setShowOutOfStockModal(false); setRestockQtys({}); }} title="Out of Stock — Quick Restock" size="lg">
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertTriangle className="text-red-600 shrink-0" size={18} />
            <p className="text-sm text-red-700 dark:text-red-400">Enter how many to add for each item and hit <span className="font-bold">+Add</span>.</p>
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {products.filter(p => p.stock <= 0).map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category} · Sell: ₱{(product.sellingPrice ?? product.price)?.toFixed(2)}</p>
                </div>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Qty"
                  className="w-20 px-2 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-red-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center"
                  value={restockQtys[product.id] || ''}
                  onChange={(e) => setRestockQtys(prev => ({ ...prev, [product.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleRestock(product)}
                />
                <button
                  onClick={() => handleRestock(product)}
                  disabled={!restockQtys[product.id] || restockingId === product.id}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {restockingId === product.id ? '...' : '+ Add'}
                </button>
              </div>
            ))}
            {products.filter(p => p.stock <= 0).length === 0 && (
              <p className="text-center text-gray-500 py-6">No out of stock items 🎉</p>
            )}
          </div>
          <button onClick={() => { setShowOutOfStockModal(false); setRestockQtys({}); }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold transition-all hover:from-red-700 hover:to-orange-600">
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
