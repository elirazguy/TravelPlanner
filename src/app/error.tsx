"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-red-50 p-6 text-center" dir="rtl">
      <div className="rounded-xl border border-red-200 bg-white p-8 shadow-xl max-w-lg w-full">
        <h2 className="mb-4 text-2xl font-bold text-red-600">שגיאת שרת פנימית (500)</h2>
        <p className="mb-6 text-sm text-zinc-600">
          אירעה שגיאה חמורה בעת טעינת העמוד. ייתכן שיש בעיה בחיבור למסד הנתונים או בהגדרות השרת.
        </p>
        <div className="mb-6 rounded-lg bg-red-100 p-4 text-left text-xs text-red-800 font-mono overflow-auto" dir="ltr">
          <p className="font-bold">Error Details:</p>
          <p>{error.message}</p>
          {error.digest && <p className="mt-2 text-[10px] opacity-70">Digest: {error.digest}</p>}
        </div>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 transition"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
