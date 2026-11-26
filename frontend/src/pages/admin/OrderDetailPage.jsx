import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  cancelOrder,
  getOrderById,
  updateOrderStatus,
} from '../../services/orderService';
import { NEXT_ORDER_STATUS, ORDER_STATUS, ROLES } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OrderTimeline from '../../components/orders/OrderTimeline';

const ACTION_LABELS = {
  CONFIRMED: 'Confirm Order',
  PROCESSING: 'Start Processing',
  SHIPPED: 'Mark as Shipped',
  DELIVERED: 'Mark as Delivered',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === ROLES.ADMIN;
  const isStaff = role === ROLES.STAFF;
  const isCustomer = role === ROLES.CUSTOMER;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load order details').message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const backPath = isAdmin
    ? '/admin/orders'
    : isStaff
    ? '/staff/orders'
    : '/customer/orders';

  const getNextAllowedStatus = (currentStatus) => {
    const next = NEXT_ORDER_STATUS[currentStatus];
    if (!next) return null;
    if (isAdmin) return next;
    if (
      isStaff &&
      (next === ORDER_STATUS.CONFIRMED || next === ORDER_STATUS.PROCESSING)
    ) {
      return next;
    }
    return null;
  };

  const canCancel =
    order &&
    (isAdmin || isCustomer) &&
    (order.status === ORDER_STATUS.PENDING ||
      order.status === ORDER_STATUS.CONFIRMED);

  const handleAdvanceStatus = async (nextStatus) => {
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, nextStatus);
      setOrder(updated);
      toast.success(`Order #${order.id} updated to ${nextStatus}.`);
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to update status.').message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder(updated);
      setCancelOpen(false);
      toast.success(`Order #${order.id} cancelled and stock restored.`);
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to cancel order.').message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading order details..." fullPage />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to={backPath}>
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <ErrorState message={error} onRetry={loadOrder} />
      </div>
    );
  }

  const nextStatus = getNextAllowedStatus(order.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.id}`}
        description={`Placed on ${formatDateTime(order.createdAt)} · Customer: ${order.customerName} (#${order.customerId})`}
        actions={
          <>
            <Link to={backPath}>
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
            {nextStatus && (
              <Button
                size="sm"
                loading={updating}
                onClick={() => handleAdvanceStatus(nextStatus)}
              >
                {ACTION_LABELS[nextStatus]}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
          </>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Fulfillment Timeline
          </h2>
          <StatusBadge status={order.status} />
        </div>
        <OrderTimeline status={order.status} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding={false}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Purchased Items ({order.items?.length || 0})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Product</th>
                  <th className="px-5 py-3 text-left font-semibold">SKU</th>
                  <th className="px-5 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-5 py-3 text-right font-semibold">Qty</th>
                  <th className="px-5 py-3 text-right font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(order.items || []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {item.productName}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                      {item.sku}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-900">
            Order Summary
          </h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Order ID</dt>
              <dd className="font-mono font-medium text-slate-900">#{order.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Customer</dt>
              <dd className="font-medium text-slate-900">
                {order.customerName} (#{order.customerId})
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <StatusBadge status={order.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Created</dt>
              <dd className="text-xs text-slate-700">
                {formatDateTime(order.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Last Updated</dt>
              <dd className="text-xs text-slate-700">
                {formatDateTime(order.updatedAt)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3">
              <dt className="text-base font-semibold text-slate-900">Total Amount</dt>
              <dd className="text-lg font-bold text-slate-900">
                {formatCurrency(order.totalAmount)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelOrder}
        loading={cancelling}
        title={`Cancel Order #${order.id}`}
        message="Are you sure you want to cancel this order? Product stock quantities will be restored automatically."
        confirmText="Confirm Cancellation"
      />
    </div>
  );
}
