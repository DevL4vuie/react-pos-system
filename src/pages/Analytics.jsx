import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Package, Tag, Calendar, Scale } from 'lucide-react';
import { subscribeToSales, subscribeToProducts } from '../services/firestoreService';

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Analytics() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [gulaySales, setGulaySales] = useState(0);

  useEffect(() => {
    const unsubscribeSales = subscribeToSales((salesData) => {
      setSales(salesData);
    });

    const unsubscribeProducts = subscribeToProducts((productsData) => {
      setProducts(productsData);
    });

    return () => {
      unsubscribeSales();
      unsubscribeProducts();
    };
  }, []);

  useEffect(() => {
    if (sales.length > 0) {
      const filteredSales = filterSalesByTimeRange(sales);
      processAnalytics(filteredSales);
    }
  }, [sales, timeRange, selectedDate]);

  const filterSalesByTimeRange = (salesData) => {
    const now = new Date();
    const selected = new Date(selectedDate);
    
    return salesData.filter(sale => {
      if (!sale.createdAt) return false;
      const saleDate = sale.createdAt.toDate();
      
      switch (timeRange) {
        case 'day':
          return saleDate.toDateString() === selected.toDateString();
        
        case 'week':
          const weekStart = new Date(selected);
          weekStart.setDate(selected.getDate() - selected.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return saleDate >= weekStart && saleDate <= weekEnd;
        
        case 'month':
          return saleDate.getMonth() === selected.getMonth() && 
                 saleDate.getFullYear() === selected.getFullYear();
        
        default:
          return true;
      }
    });
  };

  const processAnalytics = (salesData) => {
    // Calculate Gulay Sales
    const totalGulay = salesData.reduce((sum, sale) => sum + (sale.gulayTotal || 0), 0);
    setGulaySales(totalGulay);

    // Top Products
    const productSales = {};
    salesData.forEach(sale => {
      sale.items?.forEach(item => {
        if (!productSales[item.name]) {
          productSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.name].quantity += item.qty;
        productSales[item.name].revenue += item.price * item.qty;
      });
    });

    const topProds = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    setTopProducts(topProds);

    // Top Categories
    const categorySales = {};
    salesData.forEach(sale => {
      sale.items?.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categorySales[category]) {
          categorySales[category] = { name: category, value: 0 };
        }
        categorySales[category].value += item.price * item.qty;
      });
    });

    const topCats = Object.values(categorySales)
      .sort((a, b) => b.value - a.value);
    setTopCategories(topCats);

    // Sales Trend based on time range
    let trendData = [];
    const selected = new Date(selectedDate);

    if (timeRange === 'day') {
      // Hourly breakdown for single day
      trendData = Array.from({ length: 24 }, (_, i) => ({
        date: `${i}:00`,
        sales: 0,
        revenue: 0
      }));

      salesData.forEach(sale => {
        if (sale.createdAt) {
          const saleDate = sale.createdAt.toDate();
          const hour = saleDate.getHours();
          trendData[hour].sales += 1;
          trendData[hour].revenue += sale.total || 0;
        }
      });
    } else if (timeRange === 'week') {
      // Daily breakdown for week
      const weekStart = new Date(selected);
      weekStart.setDate(selected.getDate() - selected.getDay());
      
      trendData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          sales: 0,
          revenue: 0
        };
      });

      salesData.forEach(sale => {
        if (sale.createdAt) {
          const saleDate = sale.createdAt.toDate();
          const daysDiff = Math.floor((saleDate - weekStart) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 0 && daysDiff < 7) {
            trendData[daysDiff].sales += 1;
            trendData[daysDiff].revenue += sale.total || 0;
          }
        }
      });
    } else if (timeRange === 'month') {
      // Daily breakdown for month
      const daysInMonth = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
      
      trendData = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(selected.getFullYear(), selected.getMonth(), i + 1);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales: 0,
          revenue: 0
        };
      });

      salesData.forEach(sale => {
        if (sale.createdAt) {
          const saleDate = sale.createdAt.toDate();
          const day = saleDate.getDate() - 1;
          if (day >= 0 && day < daysInMonth) {
            trendData[day].sales += 1;
            trendData[day].revenue += sale.total || 0;
          }
        }
      });
    }

    setSalesTrend(trendData);
  };

  const filteredSales = filterSalesByTimeRange(sales);
  const totalProducts = filteredSales.reduce((sum, sale) => sum + (sale.items?.reduce((s, i) => s + i.qty, 0) || 0), 0);
  const avgDailySales = timeRange === 'day' ? filteredSales.length : 
                        timeRange === 'week' ? Math.round(filteredSales.length / 7) :
                        Math.round(filteredSales.length / new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).getDate());

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-900 dark:to-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
          Sales Analytics
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mt-2">Insights and performance metrics</p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Range</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('day')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-medium transition-all ${
                  timeRange === 'day'
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-medium transition-all ${
                  timeRange === 'week'
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-medium transition-all ${
                  timeRange === 'month'
                    ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Month
              </button>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
            <span className="text-xs sm:text-sm text-gray-500">Total Sales</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{filteredSales.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
              <Package className="text-pink-600" size={20} />
            </div>
            <span className="text-xs sm:text-sm text-gray-500">Products Sold</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{totalProducts}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Scale className="text-green-600" size={20} />
            </div>
            <span className="text-xs sm:text-sm text-gray-500">Gulay Sales</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">₱{gulaySales.toFixed(2)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Calendar className="text-indigo-600" size={20} />
            </div>
            <span className="text-xs sm:text-sm text-gray-500">Avg Daily Sales</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{avgDailySales}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-xl border dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-4 sm:mb-6">
            Top 5 Products
          </h3>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value, name) => [
                    name === 'quantity' ? `${value} sold` : `₱${value.toFixed(2)}`,
                    name === 'quantity' ? 'Quantity' : 'Revenue'
                  ]}
                />
                <Bar dataKey="quantity" fill="url(#colorGradient)" radius={[0, 8, 8, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#F97316" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-xl border dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4 sm:mb-6">
            Sales by Category
          </h3>
          <div className="h-64 sm:h-72 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={window.innerWidth < 640 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }}
                >
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => `₱${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sales Trend */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-xl border dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-4 sm:mb-6">
          {timeRange === 'day' ? 'Hourly' : timeRange === 'week' ? 'Weekly' : 'Monthly'} Sales Trend
        </h3>
        <div className="h-64 sm:h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }} angle={timeRange === 'month' ? -45 : 0} textAnchor={timeRange === 'month' ? 'end' : 'middle'} height={timeRange === 'month' ? 60 : 30} />
              <YAxis yAxisId="left" style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }} />
              <YAxis yAxisId="right" orientation="right" style={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? '10px' : '12px' }} />
              <Line yAxisId="left" type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} name="Transactions" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} name="Revenue (₱)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6 border-b dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">Product Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900/50 dark:to-gray-900/50 text-gray-600 dark:text-gray-400 text-xs sm:text-sm uppercase tracking-wider">
                <th className="p-3 sm:p-4 font-semibold">Product</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Quantity Sold</th>
                <th className="p-3 sm:p-4 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-purple-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-3 sm:p-4 font-medium text-gray-800 dark:text-white text-sm sm:text-base">{product.name}</td>
                  <td className="p-3 sm:p-4 text-center font-semibold text-purple-600 dark:text-purple-400 text-sm sm:text-base">
                    {product.quantity}
                  </td>
                  <td className="p-3 sm:p-4 text-right font-bold text-gray-800 dark:text-white text-sm sm:text-base">
                    ₱{product.revenue.toFixed(2)}
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
