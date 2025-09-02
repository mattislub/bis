import React, { useState } from "react";
import { API_BASE_URL } from "../../api";

export default function ProPayment() {
  const [form, setForm] = useState({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("processing");
    try {
      const res = await fetch(`${API_BASE_URL}/api/zcredit/charge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1099,
          cardNumber: form.cardNumber,
          expMonth: form.expMonth,
          expYear: form.expYear,
          cvv: form.cvv,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch (err) {
      console.error("payment error", err);
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-md p-4" dir="rtl">
      <h1 className="mb-4 text-center text-2xl font-bold">תשלום עבור פרו</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="cardNumber"
          value={form.cardNumber}
          onChange={handleChange}
          placeholder="מספר כרטיס"
          className="w-full rounded border px-3 py-2"
          required
        />
        <div className="flex space-x-2 rtl:space-x-reverse">
          <input
            name="expMonth"
            value={form.expMonth}
            onChange={handleChange}
            placeholder="חודש"
            className="w-full rounded border px-3 py-2"
            required
          />
          <input
            name="expYear"
            value={form.expYear}
            onChange={handleChange}
            placeholder="שנה"
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <input
          name="cvv"
          value={form.cvv}
          onChange={handleChange}
          placeholder="CVV"
          className="w-full rounded border px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={status === "processing"}
          className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          {status === "processing" ? "מעבד..." : "שלם עכשיו"}
        </button>
      </form>
      {status === "success" && (
        <p className="mt-4 text-center text-green-600">התשלום הצליח!</p>
      )}
      {status === "error" && (
        <p className="mt-4 text-center text-red-600">אירעה שגיאה בתשלום.</p>
      )}
    </div>
  );
}
