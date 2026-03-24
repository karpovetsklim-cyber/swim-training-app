export function LoadingSpinner({ label = 'Generating...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border border-slate-800" />
        <div className="absolute inset-0 rounded-full border border-slate-400 border-t-transparent animate-spin" />
      </div>
      <p className="font-mono text-xs text-slate-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}
