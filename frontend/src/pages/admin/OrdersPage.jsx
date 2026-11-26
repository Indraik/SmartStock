import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Eye, FilterX, Plus, ShoppingBag, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  cancelOrder,
  getOrders,
  updateOrderStatus,
} from '../../services/orderService';
import {
  NEXT_ORDER_STATUS,
  ORDER_STATUS,
  ROLES,
} from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import {
  formatCurrency,
  formatDateTime,
  toIsoDateTimeEnd,
  toIsoDateTimeStart,
} from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import CreateOrderForCustomerModal from '../../components/orders/CreateOrderForCustomerModal';

const INITIAL_FILTERS = {
  status: '',
  customerId: '',
  fromDate: '',
  toDate: '',
  minTotal: '',
  maxTotal: '',
};

const ACTION_LABELS = {
  CONFIRMED: 'Confirm Order',
  PROCESSING: 'Start Processing',
  SHIPPED: 'Mark Shipped',
  DELIVERED: 'Mark Delivered',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === ROLES.ADMIN;
  const isStaff = role === ROLES.STAFF;
  const isCustomer = role === ROLES.CUSTOMER;

  const [ordersPage, setOrdersPage] = useState({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrders({
        status: filters.status || undefined,
        customerId: !isCustomer && filters.customerId ? filters.customerId : undefined,
        fromDate: toIsoDateTimeStart(filters.fromDate),
        toDate: toIsoDateTimeEnd(filters.toDate),
        minTotal: filters.minTotal !== '' ? filters.minTotal : undefined,
        maxTotal: filters.maxTotal !== '' ? filters.maxTotal : undefined,
        page,
        size,
      });
      setOrdersPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load orders').message);
    } finally {
      setLoading(false);
    }
  }, [filters, isCustomer, page, size]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(0);
  };

  const getNextAllowedStatus = (currentStatus) => {
    const next = NEXT_ORDER_STATUS[currentStatus];
    if (!next) return null;
    if (isAdmin) return next;
    if (isStaff && (next === ORDER_STATUS.CONFIRMED || next === ORDER_STATUS.PROCESSING)) {
      return next;
    }
    return null;
  };

  const canCancelOrder = (order) => {
    if (!isAdmin && !isCustomer) return false;
    return (
      order.status === ORDER_STATUS.PENDING ||
      order.status === ORDER_STATUS.CONFIRMED
    );
  };

  const handleAdvanceStatus = async (order, nextStatus) => {
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, nextStatus);
      toast.success(`Order #${order.id} updated to ${nextStatus}.`);
      await loadOrders();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to update order status.').message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelOrder(cancelTarget.id);
      toast.success(`Order #${cancelTarget.id} cancelled and stock restored.`);
      setCancelTarget(null);
      await loadOrders();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to cancel order.').message);
    } finally {
      setCancelling(false);
    }
  };

  const getOrderDetailPath = (orderId) => {
    if (isAdmin) return `/admin/orders/${orderId}`;
    if (isStaff) return `/staff/orders/${orderId}`;
    return `/customer/orders/${orderId}`;
  };

  const columns = [
    {
      key: 'id',
      header: 'Order',
      render: (row) => (
        <div>
          <Link
            to={getOrderDetailPath(row.id)}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Order #{row.id}
          </Link>
          <p className="text-xs text-slate-500">
            {row.items?.length || 0} item(s)
          </p>
        </div>
      ),
    },
    ...(!isCustomer
      ? [
          {
            key: 'customerName',
            header: 'Customer',
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.customerName}</p>
                <p className="text-xs text-slate-500">ID #{row.customerId}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Placed On',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const nextStatus = getNextAllowedStatus(row.status);
        const cancellable = canCancelOrder(row);

        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Link to={getOrderDetailPath(row.id)}>
              <Button variant="secondary" size="sm">
                <Eye className="h-3.5 w-3.5" />
                Details
              </Button>
            </Link>

            {nextStatus && (
              <Button
                variant="primary"
                size="sm"
                loading={updatingId === row.id}
                onClick={() => handleAdvanceStatus(row, nextStatus)}
              >
                {ACTION_LABELS[nextStatus]}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}

            {cancellable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancelTarget(row)}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={isCustomer ? 'My Orders' : 'Order Management'}
        description={
          isCustomer
            ? 'Track your order status, inspect items, and cancel eligible orders.'
            : isStaff
            ? 'View customer orders, place orders on behalf of customers, and confirm or process orders.'
            : 'Manage all orders, advance fulfillment stages, place customer orders, and handle cancellations.'
        }
        actions={
          (isAdmin || isStaff) && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Place Customer Order
            </Button>
          )
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {Object.values(ORDER_STATUS).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {!isCustomer && (
            <input
              type="number"
              min="1"
              placeholder="Customer ID"
              value={filters.customerId}
              onChange={(e) => handleFilterChange('customerId', e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
          )}

          <input
            type="date"
            aria-label="From date"
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <input
            type="date"
            aria-label="To date"
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <input
            type="number"
            min="0"
            placeholder="Min Total (₹)"
            value={filters.minTotal}
            onChange={(e) => handleFilterChange('minTotal', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              placeholder="Max Total (₹)"
              value={filters.maxTotal}
              onChange={(e) => handleFilterChange('maxTotal', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            />
            <Button variant="secondary" onClick={resetFilters} title="Clear filters">
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : (
        <DataTable
          columns={columns}
          data={ordersPage.content}
          loading={loading}
          emptyIcon={ShoppingBag}
          emptyTitle="No orders found"
          emptyDescription={
            isCustomer
              ? 'You have no orders matching the selected filters.'
              : 'No orders match your current filter criteria.'
          }
          footer={
            !loading &&
            ordersPage.totalElements > 0 && (
              <Pagination
                page={ordersPage.page}
                size={ordersPage.size}
                totalElements={ordersPage.totalElements}
                totalPages={ordersPage.totalPages}
                onPageChange={setPage}
                onSizeChange={(newSize) => {
                  setSize(newSize);
                  setPage(0);
                }}
              />
            )
          }
        />
      )}

      {(isAdmin || isStaff) && (
        <CreateOrderForCustomerModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          userRole={role}
          onSuccess={loadOrders}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        title={`Cancel Order #${cancelTarget?.id}`}
        message="Are you sure you want to cancel this order? The server will automatically restore reserved product stock in a single transaction."
        confirmText="Cancel Order"
      />
    </div>
  );
}
