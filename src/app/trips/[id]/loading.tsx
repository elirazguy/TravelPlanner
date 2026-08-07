import { Loader2 } from "lucide-react";

export default function LoadingTripPage() {
  return (
    <div className="flex-1 w-full bg-[#fbfcfd] animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="border-b border-zinc-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-zinc-200 rounded-md"></div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-24 bg-zinc-200 rounded-md"></div>
              <div className="h-4 w-32 bg-zinc-200 rounded-md"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-zinc-200 rounded-full"></div>
            <div className="h-9 w-24 bg-zinc-200 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        <p className="text-zinc-500 font-medium">טוען את פרטי הטיול...</p>
      </div>
    </div>
  );
}
