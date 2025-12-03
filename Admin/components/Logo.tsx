import React from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", light = false }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center w-8 h-8">
        <ArrowRightLeft className={`${light ? 'text-purple-300' : 'text-[#6366f1]'} w-6 h-6`} strokeWidth={2.5} />
      </div>
      <span className={`font-bold text-xl tracking-tight ${light ? 'text-white' : 'text-[#0E4B5B]'}`}>
        HunarBazaar
      </span>
    </div>
  );
};