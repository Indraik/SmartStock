import { Check, XCircle } from 'lucide-react';
import { ORDER_STATUS_FLOW } from '../../utils/constants';

export default function OrderTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
        <div>
          <p className="font-semibold">Order Cancelled</p>
          <p className="text-xs text-rose-700">
            This order has been cancelled and reserved stock was restored.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <div className="overflow-x-auto pb-1">
      <ol className="flex min-w-[520px] items-center justify-between">
        {ORDER_STATUS_FLOW.map((step, index) => {
          const isCompleted = index < currentIndex || status === 'DELIVERED';
          const isCurrent = index === currentIndex && status !== 'DELIVERED';

          return (
            <li key={step} className="relative flex flex-1 flex-col items-center">
              {index !== 0 && (
                <div
                  className={`absolute top-4 z-0 h-0.5 ${
                    index <= currentIndex ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                  style={{ width: '100%', left: '-50%' }}
                />
              )}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                  isCompleted
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : isCurrent
                    ? 'border-indigo-600 bg-white text-indigo-600 ring-4 ring-indigo-50'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
