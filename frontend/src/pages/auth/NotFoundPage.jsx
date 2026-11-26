import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHomePathForRole } from '../../utils/constants';
import Button from '../../components/common/Button';

export default function NotFoundPage() {
  const { user } = useAuth();
  const target = user ? getHomePathForRole(user.role) : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <FileQuestion className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to={target}>
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
