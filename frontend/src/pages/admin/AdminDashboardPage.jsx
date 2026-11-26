import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  Warehouse,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDashboardSummary } from '../../services/dashboardService';
import { getLowStockProducts } from '../../services/inventoryService';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';

const ORDER_CHART_COLORS = {
  PENDING: '#d97706',
  CONFIRMED: '#2563eb',
  PROCESSING: '#4f46e5',
  SHIPPED: '#0891b2',
  DELIVERED: '#059669',
  CANCELLED: '#e11d48',
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, lowStockData] = await Promise.all([
        getDashboardSummary(),
        getLowStockProducts({ page: 0, size: 5 }),
      ]);
      setSummary(summaryData);
      setLowStockItems(lowStockData?.content || []);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load dashboard metrics').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <LoadingSpinner label="Loading dashboard summary..." fullPage />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboard} />;
  }

  const orderStatusData = [
    { status: 'PENDING', label: 'Pending', count: summary.pendingOrders },
    { status: 'CONFIRMED', label: 'Confirmed', count: summary.confirmedOrders },
    { status: 'PROCESSING', label: 'Processing', count: summary.processingOrders },
    { status: 'SHIPPED', label: 'Shipped', count: summary.shippedOrders },
    { status: 'DELIVERED', label: 'Delivered', count: summary.deliveredOrders },
    { status: 'CANCELLED', label: 'Cancelled', count: summary.cancelledOrders },
  ];

  const categoryData = (summary.productsByCategory || []).map((item) => ({
    name: item.categoryName,
    count: item.productCount,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Real-time overview of catalog inventory, stock alerts, and order pipeline."
        actions={
          <>
            <Link to="/admin/products">
              <Button variant="secondary" size="sm">
                <Package className="h-4 w-4" />
                Manage Products
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button size="sm">
                <ShoppingBag className="h-4 w-4" />
                View Orders
              </Button>
            </Link>
          </>
        }
      />

      {/* Primary KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Products"
          value={formatNumber(summary.totalProducts)}
          subtitle={`${formatNumber(summary.activeProducts)} active in catalog`}
          icon={Package}
          tone="indigo"
        />
        <StatCard
          title="Low-Stock Alerts"
          value={formatNumber(summary.lowStockProducts)}
          subtitle="Active products at or below threshold"
          icon={AlertTriangle}
          tone={summary.lowStockProducts > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(summary.totalOrders)}
          subtitle={`${formatNumber(summary.pendingOrders)} pending · ${formatNumber(summary.deliveredOrders)} delivered`}
          icon={ShoppingBag}
          tone="sky"
        />
        <StatCard
          title="Non-Cancelled Order Value"
          value={formatCurrency(summary.totalOrderValue)}
          subtitle="Gross value excluding cancelled orders"
          icon={IndianRupee}
          tone="emerald"
        />
      </div>

      {/* Order Pipeline Breakdown Strip */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Order Pipeline Breakdown
          </h2>
          <span className="text-xs text-slate-500">
            {formatNumber(summary.totalOrders)} total orders
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {orderStatusData.map((item) => (
            <div
              key={item.status}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
            >
              <StatusBadge status={item.status} />
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatNumber(item.count)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Orders by Status
            </h2>
            <p className="text-xs text-slate-500">
              Current order count across each fulfillment stage
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={orderStatusData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Orders" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {orderStatusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={ORDER_CHART_COLORS[entry.status] || '#4f46e5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Active Products by Category
            </h2>
            <p className="text-xs text-slate-500">
              Distribution of active catalog items across categories
            </p>
          </div>
          {categoryData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-500">
              No active products categorized yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 8, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Active Products"
                    fill="#4f46e5"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Low Stock Alerts & Quick Navigation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding={false}>
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Low-Stock Alerts
              </h2>
              <p className="text-xs text-slate-500">
                Active products requiring replenishment
              </p>
            </div>
            <Link
              to="/admin/inventory/low-stock"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-sm font-medium text-slate-900">
                All active products are well stocked
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                No products are currently at or below their low-stock threshold.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {lowStockItems.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p
                      title={item.productName}
                      className="break-words text-sm font-medium text-slate-900"
                    >
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-500">
                      SKU: {item.sku} · Threshold: {item.lowStockThreshold}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.stockQuantity} left
                    </span>
                    <StatusBadge status={item.stockStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">
            Quick Actions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Jump directly to core management workspaces
          </p>
          <div className="mt-4 space-y-2.5">
            {[
              {
                to: '/admin/products',
                label: 'Manage Product Catalog',
                desc: 'Add, edit, or deactivate products',
                icon: Package,
              },
              {
                to: '/admin/inventory',
                label: 'Adjust Inventory Levels',
                desc: 'Add, remove, or reconcile stock',
                icon: Warehouse,
              },
              {
                to: '/admin/orders',
                label: 'Process Customer Orders',
                desc: 'Advance fulfillment or cancel orders',
                icon: ShoppingBag,
              },
              {
                to: '/admin/users',
                label: 'Manage User Accounts',
                desc: 'Assign roles or toggle access',
                icon: Users,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {action.label}
                      </p>
                      <p className="text-xs text-slate-500">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
