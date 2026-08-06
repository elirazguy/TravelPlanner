"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { SetBackground } from "@/components/background/BackgroundProvider";
import { Suspense } from "react";

function TermsContent() {
  const searchParams = useSearchParams();
  const fromLogin = searchParams.get("from") === "login";

  const backLink = fromLogin ? "/login" : "/settings";
  const backText = fromLogin ? "חזרה למסך ההתחברות" : "חזרה להגדרות";

  return (
    <>
      <SetBackground name="settings" />
      <div className="mx-auto max-w-3xl py-8 pb-20">
        <Link
          href={backLink}
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ChevronRight size={16} />
          {backText}
        </Link>

        <div className="rounded-2xl border border-zinc-100 bg-white p-8 md:p-12 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <FileText size={32} className="text-violet-500" />
            <h1 className="text-3xl font-extrabold text-zinc-900">תנאי שימוש</h1>
          </div>

          <div className="prose prose-zinc max-w-none text-zinc-600 prose-headings:text-zinc-900 prose-a:text-violet-600">
            <p>
              ברוכים הבאים ל-TravelPlanner ("האפליקציה", "אנחנו"). הגישה והשימוש באפליקציה ובשירותיה כפופים לתנאי השימוש המפורטים להלן.
              בעצם ההרשמה או השימוש באפליקציה, אתה מביע את הסכמתך המלאה לתנאים אלו.
            </p>

            <h3>1. קבלת התנאים והרשמה לשירות</h3>
            <p>
              השימוש באפליקציה מותר לכל אדם המזדהה באמצעות חשבון Google תקף. אתה אחראי לשמור על אבטחת החשבון שלך ועל כל הפעולות המבוצעות בו.
            </p>

            <h3>2. תיאור השירות</h3>
            <p>
              TravelPlanner היא פלטפורמה חכמה לתכנון טיולים, ניהול מסלולים, ניתוח קצב הטיול באמצעות בינה מלאכותית, וניהול לוגיסטיקה.
              השירות מוענק כמו שהוא ("As Is"), ואנו עושים כל מאמץ להבטיח את רציפותו, דיוקו ואיכותו.
            </p>

            <h3>3. שימוש הוגן ואחריות המשתמש</h3>
            <p>
              המערכת מיועדת לשימוש אישי ופרטי. אין לעשות שימוש לרעה באפליקציה, לרבות:
            </p>
            <ul>
              <li>ניסיונות גישה בלתי מורשית למערכות או לנתונים של משתמשים אחרים.</li>
              <li>שימוש באפליקציה למטרות בלתי חוקיות או מזיקות.</li>
              <li>הצפת המערכת בבקשות אוטומטיות או שימוש לרעה ב-API של הבינה המלאכותית.</li>
            </ul>

            <h3>4. בינה מלאכותית (AI) והמלצות</h3>
            <p>
              האפליקציה משלבת רכיבי בינה מלאכותית (כגון Gemini AI) להמלצות קולינריות, ניתוח מסלול ועוזר אריזה. 
              ההמלצות וניתוחי המסלול נועדו להעשרה ולסיוע בלבד. האחריות על אימות פרטי טיסות, שעות פתיחה של אתרים, בטיחות בדרכים ותקפות הזמנות חלה עליך כמשתמש.
            </p>

            <h3>5. העלאת מסמכים והזמנות</h3>
            <p>
              ניתן להעלות קבצים (כגון מסמכי PDF וקובצי Word של אישורי מלונות) לפלטפורמה באופן יזום. המערכת מנתחת את המסמכים שהועלו בלבד כדי לחלץ את פרטי ההזמנות ולשבצן במסלול הטיול שלך.
            </p>

            <h3>6. קניין רוחני</h3>
            <p>
              כל זכויות היוצרים, סמלי המסחר, העיצובים והקוד של האפליקציה שייכים בלעדית ל-TravelPlanner.
              התוכן והמסלולים שנוצרים על ידך נשארים בבעלותך מלאה.
            </p>

            <h3>7. הגבלת אחריות</h3>
            <p>
              אנחנו איננו אחראים לכל נזק, ישיר או עקיף, העלול להיגרם עקב שימוש באפליקציה, הסתמכות על המלצות AI, שינויים בלוחות זמנים של אתרים או עיכובים בתחבורה.
            </p>

            <h3>8. סיום שירות ומחיקת חשבון</h3>
            <p>
              באפשרותך לחדול משימוש באפליקציה או למחוק את חשבונך בכל עת דרך עמוד ההגדרות.
              אנחנו שומרים לעצמנו את הזכות להפסיק את השירות או לחסום משתמש שיפר תנאים אלו.
            </p>

            <h3>9. יצירת קשר</h3>
            <p>
              בכל שאלה או פנייה בנוגע לתנאי השימוש, ניתן לפנות אלינו בדוא"ל: <strong>eliraz.guy@gmail.com</strong>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-zinc-400">טוען...</div>}>
      <TermsContent />
    </Suspense>
  );
}
