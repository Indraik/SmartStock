export default function Card({ children, className = '', padding = true }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-xs ${padding ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
