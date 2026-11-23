import React from 'react';
import { getDigitMeta } from '../utils/wingoEngine';

interface DigitBallProps {
  digit: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTextLabel?: boolean;
}

export const DigitBall: React.FC<DigitBallProps> = ({
  digit,
  size = 'md',
  showTextLabel = false,
}) => {
  const meta = getDigitMeta(digit);

  const sizeClass =
    size === 'xs'
      ? 'w-6 h-6 text-xs'
      : size === 'sm'
        ? 'w-7 h-7 text-xs'
        : size === 'lg'
          ? 'w-11 h-11 text-lg'
          : 'w-9 h-9 text-sm';

  const bgClass =
    digit === 0
      ? 'bg-[linear-gradient(135deg,#DC2626_50%,#7C3AED_50%)]'
      : digit === 5
        ? 'bg-[linear-gradient(135deg,#16A34A_50%,#7C3AED_50%)]'
        : meta.primaryColor === 'green'
          ? 'bg-green-600'
          : 'bg-red-600';

  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <span
        className={`${sizeClass} ${bgClass} rounded-full text-white font-bold font-mono-tabular inline-flex items-center justify-center ring-1 ring-black/10 select-none`}
        title={`${digit} (${meta.colorLabelEn} · ${meta.size === 'big' ? 'Big' : 'Small'})`}
      >
        {digit}
      </span>
      {showTextLabel && (
        <span className="text-xs text-slate-600 whitespace-nowrap">
          {meta.colorLabelEn} · {meta.size === 'big' ? 'Big' : 'Small'}
        </span>
      )}
    </span>
  );
};
