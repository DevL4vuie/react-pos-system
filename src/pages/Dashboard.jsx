import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Package, DollarSign, AlertCircle } from 'lucide-react';

const salesData = [
  { name: 'Mon', sales: 4000 }, { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 }, { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 6890 }, { name: 'Sat', sales: 8390 },
  { name: 'Sun', sales: 5490 },
];

const MetricCard = ({ title, value, icon: Icon, gradient, trend }) => (
  <div className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div className="mt-4 text-sm bg-white/10 inline-block px-2 py-1 rounded-md">
      {trend} vs last week
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Overview</h1>
        <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Revenue" value="$24,560" icon={DollarSign} gradient="from-blue-500 to-blue-700" trend="+12.5%" />
        <MetricCard title="Total Sales" value="1,240" icon={TrendingUp} gradient="from-purple-500 to-purple-700" trend="+8.2%" />
        <MetricCard title="Inventory Value" value="$45,230" icon={Package} gradient="from-emerald-500 to-emerald-700" trend="-2.4%" />
        <MetricCard title="Low Stock Alerts" value="12 Items" icon={AlertCircle} gradient="from-rose-500 to-rose-700" trend="Needs Action" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Weekly Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Sales Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Line type="monotone" dataKey="sales" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}