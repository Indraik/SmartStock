import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, History, SlidersHorizontal, Warehouse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInventory } from '../../services/inventoryService';
import { ROLES } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import StockAdjustModal from '../../components/inventory/StockAdjustModal';
import AdjustmentHistoryModal from '../../components/inventory/AdjustmentHistoryModal';

export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [inventoryPage, setInventoryPage] = useState({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [adjustItem, setAdjustItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInventory({ page, size });
      setInventoryPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load inventory').message);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const lowStockLink = isAdmin
    ? '/admin/inventory/low-stock'
    : '/staff/inventory/low-stock';

  const columns = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.productName}</p>
          <p className="font-mono text-xs text-slate-500">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Current Stock',
      render: (row) => (
        <span className="text-base font-bold text-slate-900">
          {row.stockQuantity}
        </span>
      ),
    },
    {
      key: 'lowStockThreshold',
      header: 'Low-Stock Threshold',
      render: (row) => (
        <span className="text-slate-600">{row.lowStockThreshold}</span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'active',
      header: 'Catalog Status',
      render: (row) => (
        <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!row.active}
            onClick={() => setAdjustItem(row)}
            title={
              row.active
                ? 'Update stock level'
                : 'Inactive products cannot be adjusted'
            }
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Adjust Stock
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryItem(row)}
            title="View audit history"
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory Management"
        description={
          isAdmin
            ? 'Monitor stock levels, perform ADD/REMOVE/ADJUST operations, and review audit logs.'
            : 'Monitor stock levels, record ADD/REMOVE stock movements, and inspect audit logs.'
        }
        actions={
          <Link to={lowStockLink}>
            <Button variant="secondary" size="sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              View Low-Stock Products
            </Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadInventory} />
      ) : (
        <DataTable
          columns={columns}
          data={inventoryPage.content}
          rowKey="productId"
          loading={loading}
          emptyIcon={Warehouse}
          emptyTitle="No inventory items found"
          emptyDescription="Products added to the catalog will appear here."
          footer={
            !loading &&
            inventoryPage.totalElements > 0 && (
              <Pagination
                page={inventoryPage.page}
                size={inventoryPage.size}
                totalElements={inventoryPage.totalElements}
                totalPages={inventoryPage.totalPages}
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

      <StockAdjustModal
        isOpen={Boolean(adjustItem)}
        onClose={() => setAdjustItem(null)}
        item={adjustItem}
        userRole={user?.role}
        onSuccess={loadInventory}
      />

      <AdjustmentHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
      />
    </div>
  );
}
