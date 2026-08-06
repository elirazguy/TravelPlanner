import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Compass size={48} className="text-brand-400" />
      <h1 className="mt-4 text-2xl font-bold text-ink-900">מחוץ למפה</h1>
      <p className="mt-1 text-sm text-ink-500">
        הדף או הטיול שחיפשת לא נמצאו.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        חזרה לטיולים
      </Link>
    </div>
  );
}
