import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Boxes } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getHomePathForRole } from '../../utils/constants';
import { parseApiError } from '../../utils/errorHandler';
import Button from '../../components/common/Button';
import FormInput from '../../components/common/FormInput';

export default function RegisterPage() {
  const { isAuthenticated, user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && user) {
    return <Navigate to={getHomePathForRole(user.role)} replace />;
  }

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = 'Name is required';
    } else if (form.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters';
    }

    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8 || form.password.length > 72) {
      errors.password = 'Password must contain 8 to 72 characters';
    }

    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = 'Passwords do not match';
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
      const response = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(
        response?.message || 'Registration successful! Please sign in.'
      );
      navigate('/login', { replace: true });
    } catch (err) {
      const parsed = parseApiError(err, 'Registration failed.');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Boxes className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            Create Customer Account
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Register to browse products and place orders on SmartStock
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          {formError && (
            <div
              role="alert"
              className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormInput
              label="Full Name"
              name="name"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              value={form.name}
              error={fieldErrors.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
              }}
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="jane@example.com"
              value={form.email}
              error={fieldErrors.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
              }}
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              hint="8 to 72 characters"
              value={form.password}
              error={fieldErrors.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
              }}
            />

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value });
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                }
              }}
            />

            <Button type="submit" loading={submitting} className="mt-2 w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
