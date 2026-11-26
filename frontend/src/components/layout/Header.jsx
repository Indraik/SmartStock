import { Link } from 'react-router-dom';
import { LogOut, Menu, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ROLES } from '../../utils/constants';
import StatusBadge from '../common/StatusBadge';

export default function Header({ onOpenMobileMenu }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Inventory &amp; Order Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user?.role === ROLES.CUSTOMER && (
          <Link
            to="/customer/cart"
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        )}

        <Link
          to="/profile"
          className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium leading-none text-slate-900">
              {user?.name}
            </p>
            <p className="mt-1 text-xs leading-none text-slate-500">
              {user?.email}
            </p>
          </div>
          <StatusBadge status={user?.role} className="hidden sm:inline-flex" />
        </Link>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
