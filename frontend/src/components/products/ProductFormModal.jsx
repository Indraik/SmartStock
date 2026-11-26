import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createProduct, updateProduct } from '../../services/productService';
import { parseApiError } from '../../utils/errorHandler';
import Modal from '../common/Modal';
import Button from '../common/Button';
import FormInput from '../common/FormInput';
import { FormSelect, FormTextarea } from '../common/FormControls';

const EMPTY_FORM = {
  name: '',
  description: '',
  sku: '',
  price: '',
  stockQuantity: '0',
  lowStockThreshold: '5',
  categoryId: '',
  supplierId: '',
};

export default function ProductFormModal({
  isOpen,
  onClose,
  product,
  categories,
  suppliers,
  onSuccess,
}) {
  const isEditing = Boolean(product);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setFormError('');
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price !== undefined ? String(product.price) : '',
        stockQuantity:
          product.stockQuantity !== undefined ? String(product.stockQuantity) : '0',
        lowStockThreshold:
          product.lowStockThreshold !== undefined
            ? String(product.lowStockThreshold)
            : '5',
        categoryId: product.categoryId ? String(product.categoryId) : '',
        supplierId: product.supplierId ? String(product.supplierId) : '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, product]);

  const activeCategories = categories.filter(
    (c) => c.active || (isEditing && String(c.id) === String(form.categoryId))
  );
  const activeSuppliers = suppliers.filter(
    (s) => s.active || (isEditing && String(s.id) === String(form.supplierId))
  );

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Product name is required';
    } else if (form.name.trim().length > 150) {
      errors.name = 'Name cannot exceed 150 characters';
    }

    if (!isEditing) {
      if (!form.sku.trim()) {
        errors.sku = 'SKU is required';
      } else if (!/^[A-Za-z0-9_-]+$/.test(form.sku.trim())) {
        errors.sku = 'SKU may only contain letters, numbers, hyphens, and underscores';
      } else if (form.sku.trim().length > 50) {
        errors.sku = 'SKU cannot exceed 50 characters';
      }
    }

    const priceNum = Number(form.price);
    if (!form.price || Number.isNaN(priceNum) || priceNum < 0.01) {
      errors.price = 'Price must be greater than zero';
    }

    if (!isEditing) {
      const stockNum = Number(form.stockQuantity);
      if (form.stockQuantity === '' || Number.isNaN(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
        errors.stockQuantity = 'Initial stock must be a non-negative integer';
      }

      if (form.lowStockThreshold !== '') {
        const threshNum = Number(form.lowStockThreshold);
        if (Number.isNaN(threshNum) || threshNum < 0 || !Number.isInteger(threshNum)) {
          errors.lowStockThreshold = 'Threshold must be a non-negative integer';
        }
      }
    }

    if (!form.categoryId) {
      errors.categoryId = 'Category is required';
    }
    if (!form.supplierId) {
      errors.supplierId = 'Supplier is required';
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
      if (isEditing) {
        await updateProduct(product.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          price: Number(form.price),
          categoryId: Number(form.categoryId),
          supplierId: Number(form.supplierId),
        });
        toast.success('Product updated successfully.');
      } else {
        await createProduct({
          name: form.name.trim(),
          description: form.description.trim() || null,
          sku: form.sku.trim().toUpperCase(),
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          lowStockThreshold:
            form.lowStockThreshold === '' ? 5 : Number(form.lowStockThreshold),
          categoryId: Number(form.categoryId),
          supplierId: Number(form.supplierId),
        });
        toast.success('Product created successfully.');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const parsed = parseApiError(err, 'Unable to save product.');
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
      title={isEditing ? 'Edit Product' : 'Create Product'}
      subtitle={
        isEditing
          ? `Editing "${product.name}" (SKU and stock quantity are managed separately)`
          : 'Add a new product with initial inventory settings'
      }
      size="lg"
    >
      {formError && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormInput
            label="Product Name"
            name="name"
            required
            placeholder="e.g. Wireless Ergonomic Mouse"
            value={form.name}
            error={fieldErrors.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
            }}
          />

          <FormInput
            label="SKU"
            name="sku"
            required={!isEditing}
            disabled={isEditing}
            placeholder="e.g. LOGI-MX-001"
            hint={isEditing ? 'SKU cannot be changed after creation' : 'Letters, numbers, - and _'}
            value={form.sku}
            error={fieldErrors.sku}
            onChange={(e) => {
              setForm({ ...form, sku: e.target.value });
              if (fieldErrors.sku) setFieldErrors({ ...fieldErrors, sku: '' });
            }}
          />
        </div>

        <FormTextarea
          label="Description"
          name="description"
          placeholder="Key features, specifications, or notes..."
          value={form.description}
          error={fieldErrors.description}
          onChange={(e) => {
            setForm({ ...form, description: e.target.value });
            if (fieldErrors.description) {
              setFieldErrors({ ...fieldErrors, description: '' });
            }
          }}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput
            label="Price (INR)"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            value={form.price}
            error={fieldErrors.price}
            onChange={(e) => {
              setForm({ ...form, price: e.target.value });
              if (fieldErrors.price) setFieldErrors({ ...fieldErrors, price: '' });
            }}
          />

          {!isEditing && (
            <>
              <FormInput
                label="Initial Stock"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                required
                value={form.stockQuantity}
                error={fieldErrors.stockQuantity}
                onChange={(e) => {
                  setForm({ ...form, stockQuantity: e.target.value });
                  if (fieldErrors.stockQuantity) {
                    setFieldErrors({ ...fieldErrors, stockQuantity: '' });
                  }
                }}
              />
              <FormInput
                label="Low-Stock Threshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                step="1"
                hint="Defaults to 5 if blank"
                value={form.lowStockThreshold}
                error={fieldErrors.lowStockThreshold}
                onChange={(e) => {
                  setForm({ ...form, lowStockThreshold: e.target.value });
                  if (fieldErrors.lowStockThreshold) {
                    setFieldErrors({ ...fieldErrors, lowStockThreshold: '' });
                  }
                }}
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            label="Category"
            name="categoryId"
            required
            value={form.categoryId}
            error={fieldErrors.categoryId}
            onChange={(e) => {
              setForm({ ...form, categoryId: e.target.value });
              if (fieldErrors.categoryId) {
                setFieldErrors({ ...fieldErrors, categoryId: '' });
              }
            }}
          >
            <option value="">Select category...</option>
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
                {!cat.active ? ' (Inactive)' : ''}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Supplier"
            name="supplierId"
            required
            value={form.supplierId}
            error={fieldErrors.supplierId}
            onChange={(e) => {
              setForm({ ...form, supplierId: e.target.value });
              if (fieldErrors.supplierId) {
                setFieldErrors({ ...fieldErrors, supplierId: '' });
              }
            }}
          >
            <option value="">Select supplier...</option>
            {activeSuppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.companyName}
                {!sup.active ? ' (Inactive)' : ''}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
