import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  ArrowRight,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { createOrder } from '../../services/orderService';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function CartPage() {
  const {
    items,
    itemCount,
    estimatedSubtotal,
    estimatedTotal,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0 || submitting) return;
    setOrderError('');
    setSubmitting(true);

    try {
      // Backend calculates authoritative prices, totals, and validates stock transactionally
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };
      const createdOrder = await createOrder(payload);
      clearCart();
      toast.success(`Order #${createdOrder.id} placed successfully!`);
      navigate(`/customer/orders/${createdOrder.id}`);
    } catch (err) {
      const parsed = parseApiError(
        err,
        'Unable to place order. Please review your cart.'
      );
      setOrderError(parsed.message);
      toast.error(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Shopping Cart"
        description="Review your selected items before submitting your order."
        actions={
          items.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmClearOpen(true)}
              disabled={submitting}
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              Clear Cart
            </Button>
          )
        }
      />

      {orderError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold">Order could not be completed</p>
            <p className="mt-0.5">{orderError}</p>
            <p className="mt-1 text-xs text-rose-700">
              Your cart has been preserved so you can adjust quantities or remove unavailable items.
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Browse the product catalog to add items to your order."
          action={
            <Link to="/customer/catalog">
              <Button>
                Browse Catalog
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2" padding={false}>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Cart Items ({itemCount})
              </h2>
            </div>

            <div className="divide-y divide-slate-200">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p
                      title={item.name}
                      className="break-words font-semibold text-slate-900"
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      SKU: {item.sku} · {item.categoryName}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        disabled={submitting}
                        aria-label={`Quantity for ${item.name}`}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isNaN(val) && val >= 1) {
                            updateQuantity(item.productId, val);
                          }
                        }}
                        className="w-14 border-x border-slate-200 py-1.5 text-center text-sm font-medium text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="w-28 text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => removeItem(item.productId)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="h-fit">
            <h2 className="text-base font-semibold text-slate-900">
              Order Summary
            </h2>
            <div className="mt-4 space-y-2.5 border-b border-slate-200 pb-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items ({itemCount})</span>
                <span>{formatCurrency(estimatedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Subtotal</span>
                <span>{formatCurrency(estimatedSubtotal)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-base font-semibold text-slate-900">
                Estimated Total
              </span>
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Final pricing and stock availability are verified securely by the server when your order is submitted.
            </p>

            <Button
              onClick={handlePlaceOrder}
              loading={submitting}
              className="mt-5 w-full"
            >
              Place Order
            </Button>

            <Link
              to="/customer/catalog"
              className="mt-3 block text-center text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              Continue Shopping
            </Link>
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          clearCart();
          setConfirmClearOpen(false);
          toast.success('Cart cleared.');
        }}
        title="Clear Shopping Cart"
        message="Are you sure you want to remove all items from your cart?"
        confirmText="Clear Cart"
      />
    </div>
  );
}
