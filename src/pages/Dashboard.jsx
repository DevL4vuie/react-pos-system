import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { subscribeToSales, subscribeToProducts } from '../services/firestoreService';
import Modal from '../components/Modal';

const MetricCard = ({ title, value, icon: Icon, gradient, trend }) => (
  <div className={`p-5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold">{value}</h3>
      </div>
      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
        <Icon size={22} className="text-white" />
      </div>
    </div>
    <div className="mt-4 text-sm bg-white/10 inline-block px-3 py-1 rounded-lg">{trend}</div>
  </div>
);

export default function Dashboard() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  useEffect(() => {
    const unsubSales = subscribeToSales((data) => {
      setSales(data);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const chartData = last7Days.map(day => {
        const dayStr = day.toDateString();
        const daySales = data.filter(s => s.createdAt?.toDate().toDateString() === dayStr);
        return {
          name: day.toLocaleDateString('en-US', { weekday: 'short' }),
          sales: daySales.reduce((sum, s) => sum + (s.total || 0), 0)
        };
      });

      setSalesData(chartData);
    });

    const unsubProducts = subscribeToProducts((data) => setProducts(data));

    return () => { unsubSales(); unsubProducts(); };
  }, []);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalSales = sales.length;
  const inventoryValue = products.reduce((sum, p) => sum + ((p.sellingPrice ?? p.price) * p.stock || 0), 0);
  const lowStockItems = products.filter(p => p.minStock ? p.stock <= p.minStock : p.stock < 10);

  return (
    <div className="relative p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-900 min-h-screen overflow-hidden">
      {/* Animated bg blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-blob absolute top-0 left-0 w-64 h-64 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute top-20 right-10 w-72 h-72 bg-orange-300/20 dark:bg-orange-500/10 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute bottom-10 left-1/2 w-56 h-56 bg-yellow-300/20 dark:bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute bottom-32 right-1/3 w-48 h-48 bg-pink-300/15 dark:bg-pink-500/10 rounded-full blur-2xl" />
        {/* Floating shapes */}
        <div className="animate-float-up absolute top-1/4 left-[8%] w-6 h-6 rounded-full bg-blue-400/30 dark:bg-blue-400/20" />
        <div className="animate-float-up animation-delay-2000 absolute top-1/3 right-[12%] w-4 h-4 rotate-45 bg-orange-400/30 dark:bg-orange-400/20" />
        <div className="animate-float-side animation-delay-1000 absolute bottom-1/4 left-[20%] w-5 h-5 rounded-sm bg-yellow-400/30 dark:bg-yellow-400/20" />
        <div className="animate-spin-slow absolute top-[15%] right-[25%] w-8 h-8 border-2 border-blue-400/30 dark:border-blue-400/20 rounded-sm" />
        <div className="animate-float-up animation-delay-3000 absolute bottom-[20%] right-[8%] w-5 h-5 rounded-full bg-pink-400/25 dark:bg-pink-400/15" />
        <div className="animate-spin-slow animation-delay-5000 absolute bottom-[35%] left-[5%] w-7 h-7 border-2 border-orange-400/25 dark:border-orange-400/15 rotate-45" />
      </div>

      <div className="relative mb-6 sm:mb-8 flex justify-end">
        <div className="text-right">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">Overview</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <MetricCard
          title="Total Revenue"
          value={`₱${totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          gradient="from-blue-500 via-blue-600 to-blue-700"
          trend="Real-time data"
        />
        <MetricCard
          title="Total Sales"
          value={totalSales}
          icon={ShoppingCart}
          gradient="from-yellow-500 via-yellow-600 to-orange-500"
          trend={`${totalSales} transactions`}
        />
        <MetricCard
          title="Inventory Value"
          value={`₱${inventoryValue.toFixed(2)}`}
          icon={Package}
          gradient="from-orange-500 via-orange-600 to-orange-700"
          trend={`${products.length} products`}
        />
        <div onClick={() => setShowLowStockModal(true)}
          className="cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Low Stock Alerts</p>
              <h3 className="text-2xl sm:text-3xl font-bold">{lowStockItems.length} Items</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle size={22} className="text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm bg-white/10 inline-block px-3 py-1 rounded-lg">
            {lowStockItems.length > 0 ? 'Click to view' : 'All Good'}
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-xl border dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-4 sm:mb-6">Weekly Revenue</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="sales" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-2xl shadow-xl border dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4 sm:mb-6">Sales Trend</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="sales" stroke="url(#lineGradient)" strokeWidth={3} dot={{ r: 5, fill: '#F97316' }} activeDot={{ r: 7 }} />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <Modal isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)} title="Low Stock Items" size="lg">
        <div className="space-y-3">
          {lowStockItems.length > 0 ? (
            lowStockItems.map((product) => (
              <div key={product.id} className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 dark:text-white">{product.name}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Current:</span>
                    <span className="font-bold text-red-600 dark:text-red-400 text-lg">{product.stock}</span>
                  </div>
                  {product.minStock && (
                    <div className="text-xs text-gray-500 mt-1">Min: {product.minStock} | Max: {product.maxStock || '-'}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>All products are well stocked!</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
