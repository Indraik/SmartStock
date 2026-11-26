import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  label = 'Loading...',
  fullPage = false,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullPage ? 'min-h-[60vh]' : 'py-12'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
