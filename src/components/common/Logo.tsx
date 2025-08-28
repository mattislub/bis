import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo.svg"
        alt="SeatFlow.tech logo"
        className="w-10 h-10"
      />
      <span className="text-2xl font-bold text-gray-800">
        SeatFlow.tech
      </span>
    </div>
  );
}

