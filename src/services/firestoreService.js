import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Collections
export const productsCollection = collection(db, 'products');
export const salesCollection = collection(db, 'sales');
export const categoriesCollection = collection(db, 'categories');

// Add Product
export const addProduct = async (productData) => {
  return await addDoc(productsCollection, {
    ...productData,
    createdAt: serverTimestamp()
  });
};

// Update Product
export const updateProduct = async (id, productData) => {
  const productRef = doc(db, 'products', id);
  return await updateDoc(productRef, productData);
};

// Delete Product
export const deleteProduct = async (id) => {
  const productRef = doc(db, 'products', id);
  return await deleteDoc(productRef);
};

// Add Sale Transaction
export const addSale = async (saleData) => {
  return await addDoc(salesCollection, {
    ...saleData,
    createdAt: serverTimestamp()
  });
};

// Add Category
export const addCategory = async (categoryData) => {
  return await addDoc(categoriesCollection, {
    ...categoryData,
    createdAt: serverTimestamp()
  });
};

// Update Category
export const updateCategory = async (id, categoryData) => {
  const categoryRef = doc(db, 'categories', id);
  return await updateDoc(categoryRef, categoryData);
};

// Delete Category
export const deleteCategory = async (id) => {
  const categoryRef = doc(db, 'categories', id);
  return await deleteDoc(categoryRef);
};

// Real-time Products Listener
export const subscribeToProducts = (callback) => {
  const q = query(productsCollection, orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(products);
  });
};

// Real-time Sales Listener
export const subscribeToSales = (callback) => {
  const q = query(salesCollection, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sales);
  });
};

// Real-time Categories Listener
export const subscribeToCategories = (callback) => {
  const q = query(categoriesCollection, orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(categories);
  });
};
