export function LoadingSpinner({ label = 'Generating...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}
