import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHomePathForRole } from '../../utils/constants';
import Button from '../../components/common/Button';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const homePath = user ? getHomePathForRole(user.role) : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to view this page with your current account role.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={homePath}>
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
