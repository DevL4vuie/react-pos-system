import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, FolderOpen } from 'lucide-react';
import { subscribeToProducts, addProduct, updateProduct, deleteProduct, subscribeToCategories, addCategory, updateCategory, deleteCategory } from '../services/firestoreService';
import Modal from '../components/Modal';

const emptyForm = { name: '', category: '', originalPrice: '', sellingPrice: '', stock: '', minStock: '', maxStock: '' };

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
        <input
          type="number"
          step="0.01"
          required
          inputMode="decimal"
          className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.sellingPrice}
          onChange={(e) => setFormData(f => ({ ...f, sellingPrice: e.target.value }))}
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Stock</label>
        <input
          type="number"
          required
          inputMode="numeric"
          className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={formData.stock}
          onChange={(e) => setFormData(f => ({ ...f, stock: e.target.value }))}
        />
      </div>
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
        sellingPrice: parseFloat(formData.sellingPrice),
        stock: parseInt(formData.stock),
        minStock: formData.minStock ? parseInt(formData.minStock) : null,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null
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
        sellingPrice: parseFloat(formData.sellingPrice),
        stock: parseInt(formData.stock),
        minStock: formData.minStock ? parseInt(formData.minStock) : null,
        maxStock: formData.maxStock ? parseInt(formData.maxStock) : null
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
      minStock: product.minStock?.toString() || '',
      maxStock: product.maxStock?.toString() || ''
    });
    setShowEditModal(true);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] table-fixed">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-900/50 dark:to-gray-900/50 text-gray-600 dark:text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-2 sm:p-4 font-semibold w-[28%]">Product Name</th>
                <th className="p-2 sm:p-4 font-semibold w-[18%]">Category</th>
                <th className="p-2 sm:p-4 font-semibold w-[12%]">Cost</th>
                <th className="p-2 sm:p-4 font-semibold w-[12%]">Selling</th>
                <th className="p-2 sm:p-4 font-semibold text-center w-[10%]">Stock</th>
                <th className="p-2 sm:p-4 font-semibold text-center w-[10%]">Min/Max</th>
                <th className="p-2 sm:p-4 font-semibold text-right w-[10%]">Actions</th>
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
                      <td className="p-2 sm:p-4 font-medium text-gray-800 dark:text-white text-sm sm:text-base truncate max-w-0">{product.name}</td>
                      <td className="p-2 sm:p-4 text-gray-600 dark:text-gray-300">
                        <span className="bg-gradient-to-r from-blue-100 to-orange-100 dark:from-blue-900/30 dark:to-orange-900/30 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-gray-500 dark:text-gray-400 text-sm">₱{original?.toFixed(2)}</td>
                      <td className="p-2 sm:p-4 text-blue-600 dark:text-blue-400 font-bold text-sm">₱{selling?.toFixed(2)}</td>
                      <td className="p-2 sm:p-4 text-center">
                        <span className={`font-bold text-sm px-3 py-1 rounded-full ${
                          product.stock <= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          isLowStock ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="p-2 sm:p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                        {product.minStock || '-'} / {product.maxStock || '-'}
                      </td>
                      <td className="p-2 sm:p-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(product); }}
                            className="text-blue-500 hover:text-blue-700 p-1.5 sm:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
                            <Edit size={16} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setShowDeleteModal(true); }}
                            className="text-red-500 hover:text-red-700 p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-6 sm:p-8 text-center text-gray-500">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm sm:text-base">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
      <Modal isOpen={showCategoryModal} onClose={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryFormData({ name: '' }); }} title="Manage Categories">
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
          <div className="max-h-64 overflow-y-auto space-y-2">
            {categories.length > 0 ? categories.map((cat) => (
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
    </div>
  );
}
