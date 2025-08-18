export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-blue-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Loading product...</h2>
        <p className="text-slate-600">Please wait while we fetch the product details.</p>
      </div>
    </div>
  );
}
