import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Edit2, Plus, Power, Tags } from 'lucide-react';
import {
  createCategory,
  getCategories,
  updateCategory,
  updateCategoryStatus,
} from '../../services/categoryService';
import { parseApiError } from '../../utils/errorHandler';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormInput from '../../components/common/FormInput';
import { FormTextarea } from '../../components/common/FormControls';
import ErrorState from '../../components/common/ErrorState';

const EMPTY_FORM = { name: '', description: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load categories').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((cat) => {
      const matchesSearch =
        !q ||
        cat.name.toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && cat.active) ||
        (statusFilter === 'INACTIVE' && !cat.active);
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      description: category.description || '',
    });
    setFieldErrors({});
    setFormError('');
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Category name is required';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }
    if (form.description && form.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
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
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success('Category updated successfully.');
      } else {
        await createCategory(payload);
        toast.success('Category created successfully.');
      }
      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      const parsed = parseApiError(err, 'Unable to save category.');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (category) => {
    setTogglingId(category.id);
    try {
      const updated = await updateCategoryStatus(category.id, !category.active);
      setCategories((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(
        `Category "${updated.name}" ${updated.active ? 'activated' : 'deactivated'}.`
      );
    } catch (err) {
      toast.error(parseApiError(err, 'Failed to update status.').message);
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (row) => <span className="font-mono text-xs text-slate-500">#{row.id}</span>,
    },
    {
      key: 'name',
      header: 'Category Name',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => (
        <span
          title={row.description || undefined}
          className="line-clamp-2 max-w-md text-slate-600"
        >
          {row.description || '—'}
        </span>
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
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openEditModal(row)}
          >
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
        title="Category Management"
        description="Organize products into active catalog categories."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            New Category
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search categories by name or description..."
          className="w-full sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="category-status-filter" className="text-xs font-medium text-slate-500">
            Status:
          </label>
          <select
            id="category-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadCategories} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredCategories}
          loading={loading}
          emptyIcon={Tags}
          emptyTitle="No categories found"
          emptyDescription="Create a product category or adjust your filter."
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        subtitle={
          editingCategory
            ? `Updating "${editingCategory.name}"`
            : 'Add a new product category to SmartStock'
        }
      >
        {formError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Category Name"
            name="name"
            required
            placeholder="e.g. Electronics"
            value={form.name}
            error={fieldErrors.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
            }}
          />
          <FormTextarea
            label="Description"
            name="description"
            placeholder="Optional description of products in this category..."
            value={form.description}
            error={fieldErrors.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value });
              if (fieldErrors.description) {
                setFieldErrors({ ...fieldErrors, description: '' });
              }
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
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
