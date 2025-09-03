import React, { useState } from "react";
import { API_BASE_URL } from "../../api";

export default function ProPayment() {
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [installments, setInstallments] = useState(1);

  const baseAmount = 1099;
  const coupons: Record<string, number> = {
    SEAT10: 0.9, // 10% הנחה
    SEAT20: 0.8 // 20% הנחה
  };
  const finalAmount = Math.round(baseAmount * (coupons[coupon] ?? 1));
  const monthlyAmount = (finalAmount / installments).toFixed(2);

  const handlePay = async () => {
    setStatus("processing");
    try {
      const res = await fetch(`${API_BASE_URL}/api/zcredit/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: baseAmount,
          description: "תשלום עבור פרו",
          orderId: `pro-plan-${Date.now()}`,
          customerName,
          customerEmail,
          coupon,
          installments
        })
      });
      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl; // הפניה לעמוד המאובטח של Z-Credit
      } else {
        console.error("Create checkout failed:", data);
        setStatus("error");
      }
    } catch (err) {
      console.error("payment error", err);
      setStatus("error");
    }
  };

  const disabled = status === "processing";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow space-y-4">
        <h1 className="mb-4 text-center text-2xl font-bold">תשלום עבור פרו</h1>

        <div>
          <label className="mb-1 block text-sm font-medium">שם לקוח</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="ישראל ישראלי"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">אימייל</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="name@example.com"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">קופון</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="הכנס קוד קופון"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">מספר תשלומים</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={installments}
            onChange={(e) => setInstallments(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold">סה"כ לתשלום: ₪{finalAmount}</div>
          {installments > 1 && (
            <div className="text-sm text-gray-600">
              תשלום חודשי: ₪{monthlyAmount}
            </div>
          )}
        </div>

        <button
          onClick={handlePay}
          disabled={disabled}
          className={`w-full rounded px-4 py-2 font-semibold text-white ${
            disabled ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {status === "processing" ? "מעבד..." : "שלם עכשיו"}
        </button>

        {status === "error" && (
          <p className="text-center text-red-600">אירעה שגיאה בתשלום. נסו שוב.</p>
        )}
      </div>
    </div>
  );
}
