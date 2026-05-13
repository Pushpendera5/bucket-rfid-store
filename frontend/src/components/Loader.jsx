import React from 'react';

const Loader = ({ size = 8, label = 'Loading...' }) => {
  const dim = size === 8 ? 'h-8 w-8' : size === 10 ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${dim} animate-spin rounded-full border-4 border-t-transparent border-brand-500`} aria-hidden />
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
};

export default Loader;
