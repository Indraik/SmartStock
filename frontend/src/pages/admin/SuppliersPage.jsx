import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit2, Plus, Power, Truck } from 'lucide-react';
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  updateSupplierStatus,
} from '../../services/supplierService';
import { parseApiError } from '../../utils/errorHandler';
import { formatDate } from '../../utils/formatters';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { FormTextarea } from '../../components/common/FormControls';
import ErrorState from '../../components/common/ErrorState';

const EMPTY_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSuppliers();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load suppliers').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((sup) => {
      const matchesSearch =
        !q ||
        sup.companyName.toLowerCase().includes(q) ||
        (sup.contactName || '').toLowerCase().includes(q) ||
        (sup.email || '').toLowerCase().includes(q) ||
        (sup.phone || '').toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && sup.active) ||
        (statusFilter === 'INACTIVE' && !sup.active);
      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      companyName: supplier.companyName || '',
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.companyName.trim()) {
      errors.companyName = 'Company name is required';
    } else if (form.companyName.trim().length > 150) {
      errors.companyName = 'Company name cannot exceed 150 characters';
    }
    if (form.contactName && form.contactName.length > 100) {
      errors.contactName = 'Contact name cannot exceed 100 characters';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }
    if (form.phone && form.phone.length > 20) {
      errors.phone = 'Phone cannot exceed 20 characters';
    }
    if (form.address && form.address.length > 500) {
      errors.address = 'Address cannot exceed 500 characters';
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
      const payload = {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
        toast.success('Supplier updated successfully.');
      } else {
        await createSupplier(payload);
        toast.success('Supplier created successfully.');
      }
      setModalOpen(false);
      await loadSuppliers();
    } catch (err) {
      const parsed = parseApiError(err, 'Unable to save supplier.');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (supplier) => {
    setTogglingId(supplier.id);
    try {
      const updated = await updateSupplierStatus(supplier.id, !supplier.active);
      setSuppliers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        `Supplier "${updated.companyName}" ${updated.active ? 'activated' : 'deactivated'}.`
      );
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to update status.').message);
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      key: 'companyName',
      header: 'Company',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.companyName}</p>
          <p className="text-xs text-slate-500">Added {formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'contactName',
      header: 'Contact Person',
      render: (row) => <span className="text-slate-700">{row.contactName || '—'}</span>,
    },
    {
      key: 'contact',
      header: 'Email & Phone',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="text-slate-700">{row.email || '—'}</p>
          <p className="text-slate-500">{row.phone || '—'}</p>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (row) => (
        <span
          title={row.address || undefined}
          className="line-clamp-2 max-w-xs text-xs text-slate-600"
        >
          {row.address || '—'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
      render: (row) => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditModal(row)}>
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant={row.active ? 'ghost' : 'secondary'}
            size="sm"
            loading={togglingId === row.id}
            onClick={() => handleToggleStatus(row)}
          >
            <Power className="h-3.5 w-3.5" />
            {row.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Supplier Management"
        description="Manage product vendors, contact details, and active status."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            New Supplier
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search suppliers by company, contact, email, or phone..."
          className="w-full sm:max-w-md"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="supplier-status-filter" className="text-xs font-medium text-slate-500">
            Status:
          </label>
          <select
            id="supplier-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Suppliers</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadSuppliers} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredSuppliers}
          loading={loading}
          emptyIcon={Truck}
          emptyTitle="No suppliers found"
          emptyDescription="Add a supplier record or clear your search filter."
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Create Supplier'}
        subtitle={
          editingSupplier
            ? `Updating "${editingSupplier.companyName}"`
            : 'Register a new vendor for SmartStock products'
        }
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Company Name"
            name="companyName"
            required
            placeholder="e.g. Logitech India Pvt. Ltd."
            value={form.companyName}
            error={fieldErrors.companyName}
            onChange={(e) => {
              setForm({ ...form, companyName: e.target.value });
              if (fieldErrors.companyName) {
                setFieldErrors({ ...fieldErrors, companyName: '' });
              }
            }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              label="Contact Person"
              name="contactName"
              placeholder="e.g. Arjun Mehta"
              value={form.contactName}
              error={fieldErrors.contactName}
              onChange={(e) => {
                setForm({ ...form, contactName: e.target.value });
                if (fieldErrors.contactName) {
                  setFieldErrors({ ...fieldErrors, contactName: '' });
                }
              }}
            />
            <FormInput
              label="Phone"
              name="phone"
              placeholder="e.g. +91 9876543210"
              value={form.phone}
              error={fieldErrors.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
              }}
            />
          </div>
          <FormInput
            label="Email"
            name="email"
            type="email"
            placeholder="vendor@company.com"
            value={form.email}
            error={fieldErrors.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
            }}
          />
          <FormTextarea
            label="Address"
            name="address"
            placeholder="Office or warehouse address..."
            value={form.address}
            error={fieldErrors.address}
            onChange={(e) => {
              setForm({ ...form, address: e.target.value });
              if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
            }}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
