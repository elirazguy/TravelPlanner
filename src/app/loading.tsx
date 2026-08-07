import { Loader2 } from "lucide-react";

export default function LoadingHomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse"></div>
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 relative z-10" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-zinc-800">טוען את המידע שלך...</h2>
        <p className="text-sm text-zinc-500">מכינים את מסך הבית</p>
      </div>
    </div>
  );
}
