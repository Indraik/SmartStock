import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit2, Eye, FilterX, Package, Plus, Power, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { getCategories } from '../../services/categoryService';
import { getSuppliers } from '../../services/supplierService';
import {
  deleteProduct,
  getProducts,
  updateProductStatus,
} from '../../services/productService';
import { ROLES } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import { formatCurrency } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ErrorState from '../../components/common/ErrorState';
import ProductFormModal from '../../components/products/ProductFormModal';
import ProductDetailModal from '../../components/products/ProductDetailModal';

const INITIAL_FILTERS = {
  search: '',
  categoryId: '',
  supplierId: '',
  minPrice: '',
  maxPrice: '',
  available: '',
  active: '',
};

export default function ProductsManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [productsPage, setProductsPage] = useState({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [detailProductId, setDetailProductId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (isAdmin) {
      getSuppliers()
        .then((data) => setSuppliers(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [isAdmin]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: debouncedSearch.trim() || undefined,
        categoryId: filters.categoryId || undefined,
        supplierId: isAdmin && filters.supplierId ? filters.supplierId : undefined,
        minPrice: filters.minPrice !== '' ? filters.minPrice : undefined,
        maxPrice: filters.maxPrice !== '' ? filters.maxPrice : undefined,
        available: filters.available !== '' ? filters.available : undefined,
        active: filters.active !== '' ? filters.active : undefined,
        page,
        size,
        sort: `${sortField},${sortDirection}`,
      };
      const data = await getProducts(params);
      setProductsPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load products').message);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    filters.categoryId,
    filters.supplierId,
    filters.minPrice,
    filters.maxPrice,
    filters.available,
    filters.active,
    isAdmin,
    page,
    size,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleToggleStatus = async (product) => {
    setTogglingId(product.id);
    try {
      await updateProductStatus(product.id, !product.active);
      toast.success(
        `Product "${product.name}" ${!product.active ? 'activated' : 'deactivated'}.`
      );
      await loadProducts();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to update product status.').message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`Product "${deleteTarget.name}" deactivated.`);
      setDeleteTarget(null);
      await loadProducts();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to deactivate product.').message);
    } finally {
      setDeleting(false);
    }
  };

  const getStockBadgeStatus = (row) => {
    if (row.stockQuantity === 0) return 'OUT_OF_STOCK';
    if (row.lowStock) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  const columns = [
    {
      key: 'name',
      header: 'Product',
      sortKey: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="font-mono text-xs text-slate-500">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'categoryName',
      header: 'Category & Supplier',
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800">{row.categoryName}</p>
          <p className="text-slate-500">{row.supplierName}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortKey: 'price',
      render: (row) => (
        <span className="font-medium text-slate-900">
          {formatCurrency(row.price)}
        </span>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      sortKey: 'stockQuantity',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{row.stockQuantity}</span>
          <StatusBadge status={getStockBadgeStatus(row)} />
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailProductId(row.id)}
            title="View details"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          {isAdmin && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingProduct(row);
                  setFormModalOpen(true);
                }}
                title="Edit product"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                loading={togglingId === row.id}
                onClick={() => handleToggleStatus(row)}
                title={row.active ? 'Deactivate' : 'Activate'}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
              {row.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(row)}
                  title="Soft delete product"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={isAdmin ? 'Product Management' : 'Product Directory'}
        description={
          isAdmin
            ? 'Manage catalog items, pricing, category/supplier assignments, and availability.'
            : 'Search and inspect product details, pricing, and stock thresholds.'
        }
        actions={
          isAdmin && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setFormModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          )
        }
      />

      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchBar
            value={filters.search}
            onChange={(val) => handleFilterChange('search', val)}
            placeholder="Search by product name or SKU..."
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

          {isAdmin && (
            <select
              aria-label="Filter by supplier"
              value={filters.supplierId}
              onChange={(e) => handleFilterChange('supplierId', e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.companyName}
                </option>
              ))}
            </select>
          )}

          <input
            type="number"
            min="0"
            placeholder="Min Price (₹)"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <input
            type="number"
            min="0"
            placeholder="Max Price (₹)"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          />

          <select
            aria-label="Filter by availability"
            value={filters.available}
            onChange={(e) => handleFilterChange('available', e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Stock Availability</option>
            <option value="true">In Stock (&gt; 0)</option>
            <option value="false">Out of Stock (0)</option>
          </select>

          <div className="flex items-center gap-2">
            <select
              aria-label="Filter by active status"
              value={filters.active}
              onChange={(e) => handleFilterChange('active', e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
            <Button
              variant="secondary"
              size="md"
              onClick={resetFilters}
              title="Clear filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : (
        <DataTable
          columns={columns}
          data={productsPage.content}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyIcon={Package}
          emptyTitle="No products match your filters"
          emptyDescription="Try clearing filters or adding a new product."
          footer={
            !loading &&
            productsPage.totalElements > 0 && (
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
            )
          }
        />
      )}

      {isAdmin && (
        <>
          <ProductFormModal
            isOpen={formModalOpen}
            onClose={() => setFormModalOpen(false)}
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onSuccess={loadProducts}
          />

          <ConfirmDialog
            isOpen={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleConfirmDelete}
            loading={deleting}
            title="Deactivate Product"
            message={`Are you sure you want to soft-delete "${deleteTarget?.name}"? It will be marked inactive so historical orders remain intact.`}
            confirmText="Deactivate"
          />
        </>
      )}

      <ProductDetailModal
        isOpen={Boolean(detailProductId)}
        onClose={() => setDetailProductId(null)}
        productId={detailProductId}
      />
    </div>
  );
}
