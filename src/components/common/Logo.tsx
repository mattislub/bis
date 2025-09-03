import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <img
          src="/logo.svg"
          alt="SeatFlow.tech logo"
          className="w-12 h-12 drop-shadow-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-black text-gray-800 leading-tight">
          SeatFlow
        </span>
        <span className="text-xs font-semibold text-blue-600 leading-tight">
          .tech
        </span>
      </div>
    </div>
  );
}