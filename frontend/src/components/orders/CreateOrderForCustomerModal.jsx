import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Info, Plus, Trash2 } from 'lucide-react';
import { createOrder } from '../../services/orderService';
import { getProducts } from '../../services/productService';
import { getUsers } from '../../services/userService';
import { ROLES } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency } from '../../utils/formatters';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormInput from '../common/FormInput';

export default function CreateOrderForCustomerModal({
  isOpen,
  onClose,
  userRole,
  onSuccess,
}) {
  const isAdmin = userRole === ROLES.ADMIN;

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [orderItems, setOrderItems] = useState([]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCustomerId('');
    setSelectedProductId('');
    setItemQuantity('1');
    setOrderItems([]);
    setFieldErrors({});
    setFormError('');

    setLoadingOptions(true);
    const tasks = [
      getProducts({ active: true, available: true, page: 0, size: 100, sort: 'name,asc' })
        .then((res) => setProducts(res?.content || []))
        .catch(() => setProducts([])),
    ];

    if (isAdmin) {
      tasks.push(
        getUsers({ page: 0, size: 100 })
          .then((res) => {
            const customerUsers = (res?.content || []).filter(
              (u) => u.role === ROLES.CUSTOMER && u.enabled
            );
            setCustomers(customerUsers);
          })
          .catch(() => setCustomers([]))
      );
    }

    Promise.all(tasks).finally(() => setLoadingOptions(false));
  }, [isOpen, isAdmin]);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const product = products.find((p) => String(p.id) === String(selectedProductId));
    if (!product) return;

    const qty = Math.max(1, Math.floor(Number(itemQuantity) || 1));
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          stockQuantity: product.stockQuantity,
          quantity: qty,
        },
      ];
    });
    setSelectedProductId('');
    setItemQuantity('1');
    if (fieldErrors.items) setFieldErrors({ ...fieldErrors, items: '' });
  };

  const handleRemoveItem = (productId) => {
    setOrderItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const estimatedTotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const validate = () => {
    const errors = {};
    const custNum = Number(customerId);
    if (!customerId || Number.isNaN(custNum) || custNum <= 0 || !Number.isInteger(custNum)) {
      errors.customerId = 'Enter a valid positive Customer ID';
    }
    if (orderItems.length === 0) {
      errors.items = 'Add at least one product to the order';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await createOrder({
        customerId: Number(customerId),
        items: orderItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      toast.success(`Order #${created.id} created for customer #${customerId}.`);
      onSuccess();
      onClose();
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to create order.');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Order for Customer"
      subtitle="Place a new order on behalf of an active customer account"
      size="lg"
    >
      {formError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {isAdmin ? (
          <div>
            <label
              htmlFor="order-customer-select"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Customer <span className="text-rose-500">*</span>
            </label>
            <select
              id="order-customer-select"
              value={customerId}
              disabled={loadingOptions}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (fieldErrors.customerId) {
                  setFieldErrors({ ...fieldErrors, customerId: '' });
                }
              }}
              className={`block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
                fieldErrors.customerId
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
              }`}
            >
              <option value="">
                {loadingOptions ? 'Loading customers...' : 'Select a customer...'}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.name} ({c.email})
                </option>
              ))}
            </select>
            {fieldErrors.customerId && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.customerId}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <p>
                Customer directory browsing is restricted to ADMIN accounts by the backend API. Enter the customer&apos;s numeric User ID directly to place an order on their behalf.
              </p>
            </div>
            <FormInput
              label="Customer User ID"
              name="customerId"
              type="number"
              min="1"
              step="1"
              required
              placeholder="e.g. 3"
              value={customerId}
              error={fieldErrors.customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (fieldErrors.customerId) {
                  setFieldErrors({ ...fieldErrors, customerId: '' });
                }
              }}
            />
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2.5 text-sm font-medium text-slate-800">Add Products</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              aria-label="Select product"
              value={selectedProductId}
              disabled={loadingOptions}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">
                {loadingOptions ? 'Loading products...' : 'Choose an available product...'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {formatCurrency(p.price)} · Stock: {p.stockQuantity}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="1"
              aria-label="Quantity"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none sm:w-24"
            />

            <Button
              type="button"
              variant="secondary"
              onClick={handleAddItem}
              disabled={!selectedProductId}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          {fieldErrors.items && (
            <p className="mt-2 text-xs text-rose-600">{fieldErrors.items}</p>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3.5 py-2 text-left font-semibold">Product</th>
                  <th className="px-3.5 py-2 text-left font-semibold">Qty</th>
                  <th className="px-3.5 py-2 text-right font-semibold">Est. Subtotal</th>
                  <th className="px-3.5 py-2 text-right font-semibold">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {orderItems.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-3.5 py-2.5">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.sku} · {formatCurrency(item.price)}
                      </p>
                    </td>
                    <td className="px-3.5 py-2.5 font-medium">{item.quantity}</td>
                    <td className="px-3.5 py-2.5 text-right font-semibold text-slate-900">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={2} className="px-3.5 py-2.5 text-right font-semibold text-slate-700">
                    Estimated Total
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                    {formatCurrency(estimatedTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Submit Order
          </Button>
        </div>
      </form>
    </Modal>
  );
}
