import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adjustStock } from '../../services/inventoryService';
import { ADJUSTMENT_TYPES, ROLES } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { FormSelect, FormTextarea } from '../common/FormControls';
import StatusBadge from '../common/StatusBadge';

export default function StockAdjustModal({
  isOpen,
  onClose,
  item,
  userRole,
  onSuccess,
}) {
  const isAdmin = userRole === ROLES.ADMIN;

  const [adjustmentType, setAdjustmentType] = useState(ADJUSTMENT_TYPES.ADD);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAdjustmentType(ADJUSTMENT_TYPES.ADD);
    setQuantity('');
    setReason('');
    setFieldErrors({});
    setFormError('');
  }, [isOpen, item]);

  const computePreview = () => {
    if (!item || quantity === '' || Number.isNaN(Number(quantity))) return null;
    const qty = Number(quantity);
    if (adjustmentType === ADJUSTMENT_TYPES.ADD) return item.stockQuantity + qty;
    if (adjustmentType === ADJUSTMENT_TYPES.REMOVE) return item.stockQuantity - qty;
    return qty;
  };

  const previewStock = computePreview();

  const validate = () => {
    const errors = {};
    const qtyNum = Number(quantity);

    if (quantity === '' || Number.isNaN(qtyNum) || !Number.isInteger(qtyNum)) {
      errors.quantity = 'Enter a valid whole number';
    } else if (adjustmentType === ADJUSTMENT_TYPES.ADJUST) {
      if (qtyNum < 0) errors.quantity = 'Stock quantity cannot be negative';
    } else if (qtyNum <= 0) {
      errors.quantity = 'Quantity must be greater than zero';
    }

    if (
      adjustmentType === ADJUSTMENT_TYPES.REMOVE &&
      item &&
      qtyNum > item.stockQuantity
    ) {
      errors.quantity = `Cannot remove more than available stock (${item.stockQuantity})`;
    }

    if (!reason.trim()) {
      errors.reason = 'Reason is required for inventory audit logs';
    } else if (reason.trim().length > 500) {
      errors.reason = 'Reason cannot exceed 500 characters';
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
      await adjustStock(item.productId, {
        adjustmentType,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      toast.success(`Stock updated for "${item.productName}".`);
      onSuccess();
      onClose();
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to adjust inventory.');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Stock Level"
      subtitle={`${item.productName} (${item.sku})`}
    >
      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs text-slate-500">Current Stock</p>
          <p className="text-lg font-bold text-slate-900">{item.stockQuantity}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Threshold</p>
          <p className="text-sm font-semibold text-slate-700">
            {item.lowStockThreshold}
          </p>
        </div>
        <StatusBadge status={item.stockStatus} />
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormSelect
          label="Operation"
          name="adjustmentType"
          required
          value={adjustmentType}
          onChange={(e) => {
            setAdjustmentType(e.target.value);
            setFieldErrors({});
          }}
        >
          <option value={ADJUSTMENT_TYPES.ADD}>ADD — Increase stock</option>
          <option value={ADJUSTMENT_TYPES.REMOVE}>REMOVE — Deduct stock</option>
          {isAdmin && (
            <option value={ADJUSTMENT_TYPES.ADJUST}>
              ADJUST — Set exact stock count
            </option>
          )}
        </FormSelect>

        <FormInput
          label={
            adjustmentType === ADJUSTMENT_TYPES.ADJUST
              ? 'New Exact Stock Quantity'
              : 'Quantity'
          }
          name="quantity"
          type="number"
          step="1"
          min={adjustmentType === ADJUSTMENT_TYPES.ADJUST ? '0' : '1'}
          required
          placeholder={
            adjustmentType === ADJUSTMENT_TYPES.ADJUST
              ? 'Enter final stock count'
              : 'Enter quantity'
          }
          value={quantity}
          error={fieldErrors.quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            if (fieldErrors.quantity) {
              setFieldErrors({ ...fieldErrors, quantity: '' });
            }
          }}
        />

        {previewStock !== null && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3.5 py-2 text-xs text-indigo-800">
            Resulting stock after update:{' '}
            <span className="font-bold">
              {previewStock < 0 ? `${previewStock} (invalid)` : previewStock}
            </span>
          </div>
        )}

        <FormTextarea
          label="Reason"
          name="reason"
          required
          placeholder="e.g. Supplier restock delivery #INV-204, damaged unit write-off, or physical cycle count"
          value={reason}
          error={fieldErrors.reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (fieldErrors.reason) setFieldErrors({ ...fieldErrors, reason: '' });
          }}
        />

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Apply Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
