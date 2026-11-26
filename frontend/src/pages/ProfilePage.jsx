import { useCallback, useEffect, useState } from 'react';
import { Calendar, Mail, Shield, UserCircle } from 'lucide-react';
import { getCurrentUser } from '../services/userService';
import { parseApiError } from '../utils/errorHandler';
import { formatDateTime } from '../utils/formatters';
import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCurrentUser();
      setProfile(data);
    } catch (err) {
      setError(parseApiError(err, 'Failed to load profile').message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <LoadingSpinner label="Loading profile..." fullPage />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadProfile} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Your authenticated SmartStock account details."
      />

      <Card className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 pb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
            {profile.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={profile.role} />
              <StatusBadge status={profile.enabled ? 'ENABLED' : 'DISABLED'} />
            </div>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-slate-500">
              <UserCircle className="h-3.5 w-3.5" />
              Account ID
            </dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-slate-900">
              #{profile.id}
            </dd>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </dt>
            <dd
              title={profile.email}
              className="mt-1 break-all text-sm font-semibold text-slate-900"
            >
              {profile.email}
            </dd>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-slate-500">
              <Shield className="h-3.5 w-3.5" />
              Assigned Role
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {profile.role}
            </dd>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-medium uppercase text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              Account Created
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {formatDateTime(profile.createdAt)}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
