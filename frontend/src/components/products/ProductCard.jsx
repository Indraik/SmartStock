import { Package, ShoppingCart, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';

export default function ProductCard({ product, onAddToCart, onViewDetails, cartQuantity = 0 }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div>
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <StatusBadge
            status={product.available ? 'IN_STOCK' : 'OUT_OF_STOCK'}
            label={product.available ? 'Available' : 'Out of Stock'}
          />
        </div>

        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {product.categoryName}
        </span>

        <h3
          title={product.name}
          className="mt-2 line-clamp-2 min-h-[3rem] text-base font-semibold leading-6 text-slate-900"
        >
          {product.name}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-slate-400">
          SKU: {product.sku}
        </p>

        <p
          title={product.description || undefined}
          className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600"
        >
          {product.description || 'No description available.'}
        </p>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-lg font-bold text-slate-900">
            {formatCurrency(product.price)}
          </span>
          {cartQuantity > 0 && (
            <span className="text-xs font-medium text-indigo-600">
              {cartQuantity} in cart
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(product.id)}
            className="flex-1"
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!product.available}
            onClick={() => onAddToCart(product)}
            className="flex-1"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
