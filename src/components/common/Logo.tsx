import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 100 100"
      >
        {/* רשת של כיסאות */}
        <rect x="10" y="10" width="20" height="20" rx="4" fill="#2563eb" />
        <rect x="40" y="10" width="20" height="20" rx="4" fill="#2563eb" />
        <rect x="70" y="10" width="20" height="20" rx="4" fill="#2563eb" />

        <rect x="10" y="40" width="20" height="20" rx="4" fill="#2563eb" />
        {/* כיסא נבחר */}
        <rect x="40" y="40" width="20" height="20" rx="4" fill="#22c55e" />
        <rect x="70" y="40" width="20" height="20" rx="4" fill="#2563eb" />

        <rect x="10" y="70" width="20" height="20" rx="4" fill="#2563eb" />
        <rect x="40" y="70" width="20" height="20" rx="4" fill="#2563eb" />
        <rect x="70" y="70" width="20" height="20" rx="4" fill="#2563eb" />
      </svg>
      <span className="text-2xl font-bold text-gray-800">
        SeatMap Manager
      </span>
    </div>
  );
}

