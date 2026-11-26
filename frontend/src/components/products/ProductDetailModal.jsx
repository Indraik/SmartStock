import { useEffect, useState } from 'react';
import { getProductById } from '../../services/productService';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorState from '../common/ErrorState';

export default function ProductDetailModal({ isOpen, onClose, productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !productId) return;
    let active = true;
    setLoading(true);
    setError('');
    getProductById(productId)
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch((err) => {
        if (active) setError(parseApiError(err, 'Failed to load product details').message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, productId]);

  const getStockStatus = (item) => {
    if (item.stockQuantity === 0) return 'OUT_OF_STOCK';
    if (item.lowStock) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      subtitle={product ? `SKU: ${product.sku}` : undefined}
      size="lg"
    >
      {loading && <LoadingSpinner label="Loading product details..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && product && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {product.name}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {product.categoryName} · Supplied by {product.supplierName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={getStockStatus(product)} />
              <StatusBadge status={product.active ? 'ACTIVE' : 'INACTIVE'} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {product.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Unit Price</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {formatCurrency(product.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Stock</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {product.stockQuantity}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Low-Stock Threshold</p>
              <p className="mt-1 text-base font-bold text-slate-900">
                {product.lowStockThreshold}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Product ID</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                #{product.id}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              <span className="font-medium text-slate-700">Created:</span>{' '}
              {formatDateTime(product.createdAt)}
            </div>
            <div>
              <span className="font-medium text-slate-700">Last Updated:</span>{' '}
              {formatDateTime(product.updatedAt)}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
