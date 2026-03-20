import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS.jsx';
import Products from './pages/Products';
import Sales from './pages/Sales'; // Make sure you created a dummy file for this!
import Practice from './pages/Practice.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route - No Sidebar here */}
          <Route path="/login" element={<Login />} />
          <Route path="/practice" element={<Practice />} />
          
          {/* Protected Routes wrapped in the Sidebar Layout */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="sales" element={<Sales />} />
            <Route path="practice" element={<Practice />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;