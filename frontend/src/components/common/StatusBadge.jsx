const BADGE_STYLES = {
  // Active / Enabled states
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  ENABLED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  DISABLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',

  // Stock statuses
  IN_STOCK: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  LOW_STOCK: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  OUT_OF_STOCK: 'bg-rose-50 text-rose-700 ring-rose-600/20',

  // Order statuses
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  CONFIRMED: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  PROCESSING: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  SHIPPED: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  DELIVERED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-600/20',

  // Roles
  ADMIN: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  STAFF: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  CUSTOMER: 'bg-slate-100 text-slate-700 ring-slate-500/20',

  // Adjustment types
  ADD: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  REMOVE: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  ADJUST: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
};

const LABELS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

export default function StatusBadge({ status, label, className = '' }) {
  const key = String(status || '').toUpperCase();
  const style = BADGE_STYLES[key] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  const display = label || LABELS[key] || key.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style} ${className}`}
    >
      {display}
    </span>
  );
}
