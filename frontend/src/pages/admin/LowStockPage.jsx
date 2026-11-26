import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, History, SlidersHorizontal, Warehouse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getLowStockProducts } from '../../services/inventoryService';
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

export default function LowStockPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [lowStockPage, setLowStockPage] = useState({
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

  const loadLowStock = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLowStockProducts({ page, size });
      setLowStockPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load low-stock products').message);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadLowStock();
  }, [loadLowStock]);

  const inventoryLink = isAdmin ? '/admin/inventory' : '/staff/inventory';

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
        <span className="text-base font-bold text-rose-600">
          {row.stockQuantity}
        </span>
      ),
    },
    {
      key: 'lowStockThreshold',
      header: 'Low-Stock Threshold',
      render: (row) => (
        <span className="text-slate-700">{row.lowStockThreshold}</span>
      ),
    },
    {
      key: 'stockStatus',
      header: 'Status',
      render: (row) => <StatusBadge status={row.stockStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setAdjustItem(row)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Restock
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryItem(row)}
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
        title="Low-Stock Products"
        description="Active products whose stock quantity is at or below their low-stock threshold."
        actions={
          <Link to={inventoryLink}>
            <Button variant="secondary" size="sm">
              <Warehouse className="h-4 w-4" />
              All Inventory
            </Button>
          </Link>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={loadLowStock} />
      ) : (
        <DataTable
          columns={columns}
          data={lowStockPage.content}
          rowKey="productId"
          loading={loading}
          emptyIcon={CheckCircle2}
          emptyTitle="No low-stock products"
          emptyDescription="All active products currently have stock above their configured threshold."
          footer={
            !loading &&
            lowStockPage.totalElements > 0 && (
              <Pagination
                page={lowStockPage.page}
                size={lowStockPage.size}
                totalElements={lowStockPage.totalElements}
                totalPages={lowStockPage.totalPages}
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
        onSuccess={loadLowStock}
      />

      <AdjustmentHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
      />
    </div>
  );
}
