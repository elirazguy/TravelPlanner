"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { SetBackground } from "@/components/background/BackgroundProvider";
import { Suspense } from "react";

function PrivacyContent() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");

  const isFromSettings = fromParam === "settings";
  const backLink = isFromSettings ? "/settings" : "/";
  const backText = isFromSettings ? "חזרה להגדרות" : "חזרה לדף הבית";

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
            <ShieldCheck size={32} className="text-blue-500" />
            <h1 className="text-3xl font-extrabold text-zinc-900">מדיניות פרטיות</h1>
          </div>

          <div className="prose prose-zinc max-w-none text-zinc-600 prose-headings:text-zinc-900 prose-a:text-blue-600">
            <p>
              ברוכים הבאים ל-TravelPlanner ("אנחנו", "האפליקציה"). אנו לוקחים את פרטיותך ברצינות רבה ומחויבים להגן על המידע האישי שלך.
              מדיניות פרטיות זו מתארת איזה מידע אנו אוספים, מדוע אנו אוספים אותו, וכיצד אנו עושים בו שימוש במסגרת מתן השירות שלנו.
            </p>

            <h3>איזה מידע אנו אוספים?</h3>
            <p>
              כדי לספק לך את השירות הטוב ביותר, אנו אוספים את המידע הבא בעת התחברותך דרך חשבון Google:
            </p>
            <ul>
              <li><strong>מידע פרופיל בסיסי:</strong> שם תצוגה, כתובת אימייל ותמונת פרופיל (המתקבלים מחשבון Google שלך).</li>
              <li><strong>תוכן משתמש וטיולים:</strong> טיולים שיצרת, מסמכים והזמנות שהעלית באופן יזום, רשימות ציוד והעדפות אישיות שאתה מזין באפליקציה.</li>
            </ul>

            <h3>כיצד אנו משתמשים במידע שלך?</h3>
            <p>
              המידע נאסף ומשמש אך ורק למטרות תפעול האפליקציה:
            </p>
            <ul>
              <li><strong>זיהוי וניהול חשבון:</strong> יצירת אזור אישי עבורך ושיוך הטיולים שלך רק אליך.</li>
              <li><strong>תכנון ועיבוד חכם:</strong> בעת העלאת קבצים או הזמנות, מודל בינה מלאכותית מסייע בחילוץ הנתונים (כגון שמות מלונות ותאריכים) לשילוב במסלול הטיול שלך.</li>
            </ul>

            <h3>שיתוף מידע עם צדדים שלישיים</h3>
            <p>
              אנו <strong>איננו</strong> מוכרים, משכירים או מעבירים את המידע האישי שלך לגורמים חיצוניים למטרות שיווק.
              תוכן שאתה מעלה או מבקש לנתח מעובד בצורה מאובטחת באמצעות שירות הבינה המלאכותית (Google Gemini API). הנתונים אינם משמשים לאימון מודלים ציבוריים.
            </p>

            <h3>שמירת נתונים ומחיקת חשבון</h3>
            <p>
              אנו שומרים את הנתונים שלך כל עוד חשבונך פעיל. 
              באזור <strong>הגדרות חשבון</strong>, קיימת עבורך אפשרות ל<strong>מחיקת חשבון מוחלטת</strong> ("אזור סכנה"). 
              לחיצה על כפתור זה תמחק באופן מיידי ולצמיתות את כל המידע האישי שלך, כולל כל הטיולים והציוד, משרתי האפליקציה. לא ניתן לשחזר מידע לאחר מחיקתו.
            </p>

            <h3>אבטחת מידע</h3>
            <p>
              אנו נוקטים באמצעי אבטחה טכנולוגיים מחמירים כדי להגן על המידע האישי והטיולים שלך במערכת.
            </p>

            <h3>שינויים במדיניות</h3>
            <p>
              אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת. במקרה של שינויים משמעותיים, תופיע הודעה מתאימה באפליקציה.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-zinc-400">טוען...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}
