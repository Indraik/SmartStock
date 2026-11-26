import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getOrders } from '../../services/orderService';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const { itemCount, estimatedTotal } = useCart();

  const [ordersPage, setOrdersPage] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecentOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrders({ page: 0, size: 5 });
      setOrdersPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load your recent orders').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentOrders();
  }, [loadRecentOrders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name || 'Customer'}`}
        description="Browse products, manage your cart, and track your recent orders."
        actions={
          <>
            <Link to="/customer/catalog">
              <Button variant="secondary" size="sm">
                <Store className="h-4 w-4" />
                Browse Catalog
              </Button>
            </Link>
            <Link to="/customer/cart">
              <Button size="sm">
                <ShoppingCart className="h-4 w-4" />
                View Cart ({itemCount})
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Orders Placed"
          value={ordersPage.totalElements || 0}
          subtitle="Across all order statuses"
          icon={ShoppingBag}
          tone="indigo"
        />
        <StatCard
          title="Items in Cart"
          value={itemCount}
          subtitle={
            itemCount > 0
              ? `Est. ${formatCurrency(estimatedTotal)}`
              : 'Your cart is currently empty'
          }
          icon={ShoppingCart}
          tone="sky"
        />
        <StatCard
          title="Account Status"
          value={user?.enabled ? 'Active' : 'Disabled'}
          subtitle={user?.email}
          icon={Package}
          tone="emerald"
        />
      </div>

      <Card padding={false}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Orders
            </h2>
            <p className="text-xs text-slate-500">
              Your latest orders and current fulfillment status
            </p>
          </div>
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            All Orders <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading recent orders..." />
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={loadRecentOrders} />
          </div>
        ) : ordersPage.content.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-900">
              You haven&apos;t placed any orders yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Explore the product catalog to start your first order.
            </p>
            <Link to="/customer/catalog" className="mt-4 inline-block">
              <Button size="sm">Shop Products</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {ordersPage.content.map((order) => (
              <Link
                key={order.id}
                to={`/customer/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-slate-900">
                      Order #{order.id}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.items?.length || 0} item(s) · Placed{' '}
                    {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
