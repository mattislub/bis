import React, { useState } from "react";
import { API_BASE_URL } from "../../api";

export default function ProPayment() {
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");

  const handlePay = async () => {
    setStatus("processing");
    try {
      const res = await fetch(`${API_BASE_URL}/api/zcredit/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1099,
          description: "תשלום עבור פרו",
          orderId: "pro-plan"
        })
      });
      const data = await res.json();
      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("payment error", err);
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-md p-4" dir="rtl">
      <h1 className="mb-4 text-center text-2xl font-bold">תשלום עבור פרו</h1>
      <button
        onClick={handlePay}
        disabled={status === "processing"}
        className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
      >
        {status === "processing" ? "מעבד..." : "שלם עכשיו"}
      </button>
      {status === "error" && (
        <p className="mt-4 text-center text-red-600">אירעה שגיאה בתשלום.</p>
      )}
    </div>
  );
}

