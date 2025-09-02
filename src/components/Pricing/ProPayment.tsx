import React, { useState } from "react";
import { API_BASE_URL } from "../../api";

export default function ProPayment() {
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const handlePay = async () => {
    setStatus("processing");
    try {
      const res = await fetch(`${API_BASE_URL}/api/zcredit/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1099, // ₪ 1,099.00 (כלומר 1099.00 — השדה נשלח כמספר, השרת מעגל ל-2 ספרות)
          description: "תשלום עבור פרו",
          orderId: `pro-plan-${Date.now()}`,
          customerName,
          customerEmail
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
    <div className="mx-auto max-w-md p-4" dir="rtl">
      <h1 className="mb-4 text-center text-2xl font-bold">תשלום עבור פרו</h1>

      <label className="mb-2 block text-sm font-medium">שם לקוח</label>
      <input
        className="mb-4 w-full rounded border px-3 py-2"
        placeholder="ישראל ישראלי"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <label className="mb-2 block text-sm font-medium">אימייל</label>
      <input
        className="mb-6 w-full rounded border px-3 py-2"
        placeholder="name@example.com"
        value={customerEmail}
        onChange={(e) => setCustomerEmail(e.target.value)}
      />

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
        <p className="mt-4 text-center text-red-600">אירעה שגיאה בתשלום. נסו שוב.</p>
      )}
    </div>
  );
}
