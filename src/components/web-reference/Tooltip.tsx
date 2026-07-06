
import React, { useState } from 'react';

export const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative flex items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute top-10 left-0 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap z-50">
          {text}
        </div>
      )}
    </div>
  );
};
