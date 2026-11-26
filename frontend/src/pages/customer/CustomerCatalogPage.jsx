import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FilterX, Package, ShoppingCart, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useDebounce } from '../../hooks/useDebounce';
import { getCategories } from '../../services/categoryService';
import { getProductById, getProducts } from '../../services/productService';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import ProductCard from '../../components/products/ProductCard';

const INITIAL_FILTERS = {
  search: '',
  categoryId: '',
  minPrice: '',
  maxPrice: '',
  available: '',
};

export default function CustomerCatalogPage() {
  const { items: cartItems, itemCount, addItem } = useCart();

  const [productsPage, setProductsPage] = useState({
    content: [],
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [sort, setSort] = useState('name,asc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailQty, setDetailQty] = useState(1);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Important: Customers must NOT send supplierId or active parameters
      const data = await getProducts({
        search: debouncedSearch.trim() || undefined,
        categoryId: filters.categoryId || undefined,
        minPrice: filters.minPrice !== '' ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice !== '' ? filters.maxPrice : undefined,
        available: filters.available !== '' ? filters.available : undefined,
        page,
        size,
        sort,
      });
      setProductsPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load product catalog').message);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.categoryId,
    filters.minPrice,
    filters.maxPrice,
    filters.available,
    page,
    size,
    sort,
  ]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSort('name,asc');
    setPage(0);
  };

  const handleAddToCart = (product, qty = 1) => {
    addItem(product, qty);
    toast.success(`Added ${qty} × ${product.name} to cart.`);
  };

  const handleViewDetails = async (productId) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError('');
    setDetailProduct(null);
    setDetailQty(1);
    try {
      const data = await getProductById(productId);
      setDetailProduct(data);
    } catch (err) {
      setDetailError(parseApiError(err, 'Failed to load product details').message);
    } finally {
      setDetailLoading(false);
    }
  };

  const getCartQuantity = (productId) => {
    const found = cartItems.find((item) => item.productId === productId);
    return found ? found.quantity : 0;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product Catalog"
        description="Browse active products and add items to your cart."
        actions={
          <Link to="/customer/cart">
            <Button variant="primary" size="sm">
              <ShoppingCart className="h-4 w-4" />
              Cart ({itemCount})
            </Button>
          </Link>
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SearchBar
            value={filters.search}
            onChange={(val) => handleFilterChange('search', val)}
            placeholder="Search products or SKU..."
            className="sm:col-span-2"
          />

          <select
            aria-label="Filter by category"
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <input
            type="number"
            min="0"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <div className="flex items-center gap-2">
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="name,asc">Name: A–Z</option>
              <option value="name,desc">Name: Z–A</option>
              <option value="price,asc">Price: Low to High</option>
              <option value="price,desc">Price: High to Low</option>
            </select>
            <Button
              variant="secondary"
              onClick={resetFilters}
              title="Reset filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium text-slate-500">Availability:</span>
          {[
            { label: 'All', value: '' },
            { label: 'In Stock Only', value: 'true' },
            { label: 'Out of Stock', value: 'false' },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleFilterChange('available', opt.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filters.available === opt.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner label="Loading catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCatalog} />
      ) : productsPage.content.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No products found"
          description="Try adjusting your search or filter selections."
          action={
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productsPage.content.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={getCartQuantity(product.id)}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {productsPage.totalElements > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Pagination
                page={productsPage.page}
                size={productsPage.size}
                totalElements={productsPage.totalElements}
                totalPages={productsPage.totalPages}
                onPageChange={setPage}
                onSizeChange={(newSize) => {
                  setSize(newSize);
                  setPage(0);
                }}
              />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Product Details"
        subtitle={detailProduct ? `SKU: ${detailProduct.sku}` : undefined}
      >
        {detailLoading && <LoadingSpinner label="Loading product..." />}
        {!detailLoading && detailError && <ErrorState message={detailError} />}
        {!detailLoading && !detailError && detailProduct && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {detailProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {detailProduct.categoryName}
                  </p>
                </div>
              </div>
              <StatusBadge
                status={detailProduct.available ? 'IN_STOCK' : 'OUT_OF_STOCK'}
                label={detailProduct.available ? 'Available' : 'Out of Stock'}
              />
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              {detailProduct.description || 'No description provided.'}
            </p>

            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-600">Unit Price</span>
              <span className="text-xl font-bold text-slate-900">
                {formatCurrency(detailProduct.price)}
              </span>
            </div>

            {detailProduct.available && (
              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="detail-qty"
                    className="text-sm font-medium text-slate-700"
                  >
                    Quantity:
                  </label>
                  <input
                    id="detail-qty"
                    type="number"
                    min="1"
                    max="1000"
                    value={detailQty}
                    onChange={(e) =>
                      setDetailQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <Button
                  onClick={() => {
                    handleAddToCart(detailProduct, detailQty);
                    setDetailModalOpen(false);
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
