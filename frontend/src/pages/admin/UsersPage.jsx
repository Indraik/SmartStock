import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, ShieldCheck, UserCheck, UserX, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById,
  getUsers,
  updateUserRole,
  updateUserStatus,
} from '../../services/userService';
import { ROLES } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import { formatDate, formatDateTime } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorState from '../../components/common/ErrorState';

export default function UsersPage() {
  const { user: currentUser } = useAuth();

  const [usersPage, setUsersPage] = useState({
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

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers({ page, size });
      setUsersPage(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load users').message);
    } finally {
      setLoading(false);
    }
  }, [page, size]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleViewDetails = async (userId) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailUser(null);
    try {
      const data = await getUserById(userId);
      setDetailUser(data);
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to load user details').message);
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const isProtectedUser = (target) => {
    return (
      target.id === currentUser?.id ||
      target.email === currentUser?.email ||
      target.role === ROLES.ADMIN
    );
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'STATUS') {
        const updated = await updateUserStatus(
          confirmAction.user.id,
          confirmAction.nextEnabled
        );
        toast.success(
          `Account for ${updated.name} ${updated.enabled ? 'enabled' : 'disabled'}.`
        );
      } else if (confirmAction.type === 'ROLE') {
        const updated = await updateUserRole(
          confirmAction.user.id,
          confirmAction.nextRole
        );
        toast.success(
          `Role for ${updated.name} updated to ${updated.role}.`
        );
      }
      setConfirmAction(null);
      await loadUsers();
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to update user account.').message);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">#{row.id}</span>
      ),
    },
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.name}
            {row.id === currentUser?.id && (
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                You
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => {
        const protectedRow = isProtectedUser(row);
        if (protectedRow) {
          return (
            <div className="flex items-center gap-1.5">
              <StatusBadge status={row.role} />
              {row.role === ROLES.ADMIN && (
                <span title="Protected administrator account">
                  <ShieldCheck
                    className="h-4 w-4 text-indigo-500"
                    aria-label="Protected administrator account"
                  />
                </span>
              )}
            </div>
          );
        }
        return (
          <select
            aria-label={`Change role for ${row.name}`}
            value={row.role}
            onChange={(e) => {
              const nextRole = e.target.value;
              if (nextRole !== row.role) {
                setConfirmAction({
                  type: 'ROLE',
                  user: row,
                  nextRole,
                });
              }
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            <option value={ROLES.CUSTOMER}>CUSTOMER</option>
            <option value={ROLES.STAFF}>STAFF</option>
          </select>
        );
      },
    },
    {
      key: 'enabled',
      header: 'Account Status',
      render: (row) => (
        <StatusBadge status={row.enabled ? 'ENABLED' : 'DISABLED'} />
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => {
        const protectedRow = isProtectedUser(row);
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(row.id)}
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
            <Button
              variant={row.enabled ? 'secondary' : 'success'}
              size="sm"
              disabled={protectedRow}
              title={
                protectedRow
                  ? 'Protected administrator and self accounts cannot be modified'
                  : undefined
              }
              onClick={() =>
                setConfirmAction({
                  type: 'STATUS',
                  user: row,
                  nextEnabled: !row.enabled,
                })
              }
            >
              {row.enabled ? (
                <>
                  <UserX className="h-3.5 w-3.5 text-rose-600" />
                  Disable
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Enable
                </>
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        description="Manage CUSTOMER and STAFF account access and role assignments. Administrator accounts are protected."
      />

      {error ? (
        <ErrorState message={error} onRetry={loadUsers} />
      ) : (
        <DataTable
          columns={columns}
          data={usersPage.content}
          loading={loading}
          emptyIcon={Users}
          emptyTitle="No users found"
          emptyDescription="Registered user accounts will appear here."
          footer={
            !loading &&
            usersPage.totalElements > 0 && (
              <Pagination
                page={usersPage.page}
                size={usersPage.size}
                totalElements={usersPage.totalElements}
                totalPages={usersPage.totalPages}
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

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="User Account Details"
      >
        {detailLoading ? (
          <LoadingSpinner label="Loading user profile..." />
        ) : (
          detailUser && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-500">User ID</dt>
                <dd className="font-mono font-medium text-slate-900">
                  #{detailUser.id}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{detailUser.name}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-500">Email</dt>
                <dd className="text-slate-900">{detailUser.email}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-500">Role</dt>
                <dd>
                  <StatusBadge status={detailUser.role} />
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusBadge
                    status={detailUser.enabled ? 'ENABLED' : 'DISABLED'}
                  />
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2.5">
                <dt className="text-slate-500">Created At</dt>
                <dd className="text-xs text-slate-700">
                  {formatDateTime(detailUser.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Last Updated</dt>
                <dd className="text-xs text-slate-700">
                  {formatDateTime(detailUser.updatedAt)}
                </dd>
              </div>
            </dl>
          )
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        loading={actionLoading}
        variant={
          confirmAction?.type === 'STATUS' && !confirmAction.nextEnabled
            ? 'danger'
            : 'primary'
        }
        title={
          confirmAction?.type === 'ROLE'
            ? 'Change User Role'
            : confirmAction?.nextEnabled
            ? 'Enable Account'
            : 'Disable Account'
        }
        message={
          confirmAction?.type === 'ROLE'
            ? `Change role for "${confirmAction?.user?.name}" to ${confirmAction?.nextRole}?`
            : confirmAction?.nextEnabled
            ? `Re-enable access for "${confirmAction?.user?.name}"?`
            : `Disable access for "${confirmAction?.user?.name}"? They will no longer be able to sign in or make API requests.`
        }
        confirmText="Confirm"
      />
    </div>
  );
}
