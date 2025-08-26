import React from "react";
import { Check, Sparkles, ArrowRight, Shield } from "lucide-react";

/**
 * PricingSinglePlanWithDemo
 * — One clear paid plan + a friendly demo CTA
 * TailwindCSS, RTL-friendly
 */
export default function PricingSinglePlanWithDemo() {
  const features: string[] = [
    "עיצוב מפת בית הכנסת",
    "מדבקות למקומות",
    "קישור למסך הבית הכנסת",
    "ייצוא לקובץ PDF",
    "אין הגבלה על מספר המפות שאפשר לעצב",
    "ניהול מתפללים",
  ];

  return (
    <div className="relative isolate overflow-hidden">
      {/* Soft background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[110%] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-blue-50 to-transparent blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
            <Sparkles className="h-3.5 w-3.5" /> מהדורה ראשונית
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            מחירון
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg leading-7 text-gray-600">
            תכנית אחת ברורה. אם אתם עדיין לא בטוחים — אפשר לנסות דמו.
          </p>
        </div>

        {/* Content grid: Pro plan + Demo card */}
        <div className="mt-12 grid grid-cols-1 items-stretch gap-6 md:grid-cols-5">
          {/* Pro Card (dominant) */}
          <div className="md:col-span-3">
            <div className="relative h-full rounded-3xl border border-blue-200 bg-white p-8 shadow-sm ring-1 ring-blue-100 transition hover:-translate-y-1 hover:shadow-xl">
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                הכי פופולרי
              </span>

              <div className="flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                  <Shield className="h-3.5 w-3.5" /> פרו
                </div>
                <div className="mt-3 text-5xl font-black text-blue-700">
                  ₪1099
                  <span className="ml-2 align-middle text-base font-normal text-gray-600">
                    לשנה
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">אפשר לחלק ל‑12 תשלומים</p>
              </div>

              <ul className="mt-8 grid grid-cols-1 gap-3 text-gray-800 sm:grid-cols-2">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 rtl:space-x-reverse">
                    <Check className="h-5 w-5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  התחילו עכשיו
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Demo CTA (secondary) */}
          <div className="md:col-span-2">
            <div className="flex h-full flex-col justify-between rounded-3xl border border-gray-200 bg-white/70 p-7 shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">עדיין לא בטוחים?</h3>
                <p className="mt-2 text-gray-600">
                  נסו את מערכת הדוגמה שלנו — אין צורך בכרטיס אשראי. תרגישו את הזרימה,
                  בדקו הדפסות PDF והצגת מפות.
                </p>

                <ul className="mt-6 space-y-2 text-gray-700">
                  {[
                    "ממשק מלא לעיצוב מפת בית הכנסת",
                    "עבודה חופשית ללא שמירה קבועה",
                    "מעולה להתרשמות מהיכולות",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 rtl:space-x-reverse">
                      <Check className="h-5 w-5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <a
                  href="#demo" // TODO: wire to your demo route
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
                >
                  נסו את הדמו
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </a>
                <p className="mt-2 text-center text-xs text-gray-500">
                  הדמו אינו כולל שמירת נתונים קבועה.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tiny reassurance bar */}
        <div className="mt-8 text-center text-sm text-gray-500">
          ללא התחייבות. ניתן לבטל חידוש אוטומטי בכל עת.
        </div>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mt-14">
          <h2 id="faq-heading" className="text-center text-2xl font-bold text-gray-900">
            שאלות נפוצות
          </h2>
          <p className="mt-2 text-center text-gray-600">
            אם משהו לא ברור — הנה התשובות לשאלות שחוזרות הכי הרבה.
          </p>

          <div className="mx-auto mt-8 max-w-3xl divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white/70">
            {[
              {
                q: "מה ההבדל בין הפרו לבין הדמו?",
                a:
                  "הדמו מיועד להתנסות חופשית בממשק (ללא שמירת נתונים קבועה). תכנית הפרו כוללת את כל היכולות המלאות: שמירה, ייצוא PDF, מדבקות, קישור למסך הבית הכנסת וניהול מתפללים.",
              },
              {
                q: "האם אפשר לפרוס תשלום?",
                a:
                  "כן. ניתן לחלק ל‑12 תשלומים חודשיים ללא ריבית דרך הספק/שער התשלום המוגדר אצלכם.",
              },
              {
                q: "האם יש הגבלה על מספר המפות?",
                a: "לא. בתכנית הפרו אין הגבלה על מספר המפות שתעצבו ותשמרו.",
              },
              {
                q: "האם אפשר לייצא ל‑PDF באיכות הדפסה?",
                a:
                  "כן. ייצוא ה‑PDF מותאם להדפסה. ניתן לבחור פורמט וגודל דף, ולהדפיס מדבקות או מפה מלאה.",
              },
              {
                q: "מה לגבי קישור למסך התצוגה בבית הכנסת?",
                a:
                  "בתכנית הפרו קיים קישור/מצב תצוגה ייעודי להצגת המפה על מסך גדול, עם התאמות קריאות.",
              },
              {
                q: "האם אפשר לבטל?",
                a:
                  "בוודאי. ניתן לבטל חידוש שנתי בכל עת לפני תאריך החידוש. השימוש נמשך עד סוף התקופה ששולמה.",
              },
              {
                q: "האם הנתונים שלי נשמרים בבטחה?",
                a:
                  "הפרויקט שומר מידע באופן מאובטח. ניתן גם לייצא גיבוי תקופתי לקבצים אצלכם.",
              },
              {
                q: "האם יש תמיכה?",
                a:
                  "כן. כוללים תמיכה בדוא" + '"' + "ל ומענה מהיר לשאלות שימוש והגדרות.",
              },
            ].map((item) => (
              <details key={item.q} className="group open:bg-white/80">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-right font-medium text-gray-900">
                  <span>{item.q}</span>
                  <span className="text-gray-400 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="px-5 pb-5 text-gray-700">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
