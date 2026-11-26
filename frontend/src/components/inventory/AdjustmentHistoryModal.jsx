import { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { getAdjustmentHistory } from '../../services/inventoryService';
import { parseApiError } from '../../utils/errorHandler';
import { formatDateTime } from '../../utils/formatters';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import Pagination from '../common/Pagination';

export default function AdjustmentHistoryModal({ isOpen, onClose, item }) {
  const [historyPage, setHistoryPage] = useState({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    if (!item?.productId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getAdjustmentHistory(item.productId, { page, size: 10 });
      setHistoryPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load adjustment history').message);
    } finally {
      setLoading(false);
    }
  }, [item?.productId, page]);

  useEffect(() => {
    if (isOpen && item?.productId) {
      setPage(0);
    }
  }, [isOpen, item?.productId]);

  useEffect(() => {
    if (isOpen && item?.productId) {
      loadHistory();
    }
  }, [isOpen, item?.productId, loadHistory]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inventory Adjustment History"
      subtitle={item ? `${item.productName} (${item.sku})` : undefined}
      size="xl"
    >
      {loading && <LoadingSpinner label="Loading audit log..." />}
      {!loading && error && <ErrorState message={error} onRetry={loadHistory} />}
      {!loading && !error && historyPage.content.length === 0 && (
        <EmptyState
          icon={History}
          title="No adjustments recorded"
          description="Manual stock additions, removals, and adjustments for this product will appear here."
        />
      )}
      {!loading && !error && historyPage.content.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    Type
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    Previous
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    Change
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    New
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    Reason
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    Changed By
                  </th>
                  <th className="px-3.5 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-sm">
                {historyPage.content.map((entry) => {
                  const delta = entry.adjustmentQuantity;
                  const deltaLabel = delta > 0 ? `+${delta}` : String(delta);
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80">
                      <td className="px-3.5 py-3">
                        <StatusBadge status={entry.adjustmentType} />
                      </td>
                      <td className="px-3.5 py-3 text-slate-600">
                        {entry.previousQuantity}
                      </td>
                      <td
                        className={`px-3.5 py-3 font-semibold ${
                          delta > 0
                            ? 'text-emerald-600'
                            : delta < 0
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {deltaLabel}
                      </td>
                      <td className="px-3.5 py-3 font-semibold text-slate-900">
                        {entry.newQuantity}
                      </td>
                      <td className="max-w-xs px-3.5 py-3 text-xs text-slate-700">
                        {entry.reason}
                      </td>
                      <td className="px-3.5 py-3 text-xs text-slate-600">
                        {entry.changedBy}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-3 text-xs text-slate-500">
                        {formatDateTime(entry.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={historyPage.page}
            size={historyPage.size}
            totalElements={historyPage.totalElements}
            totalPages={historyPage.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </Modal>
  );
}
