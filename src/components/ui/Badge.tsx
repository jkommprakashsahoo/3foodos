import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'verified'
  | 'predicted'
  | 'estimated'
  | 'demo';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  let style = 'bg-[#F0F0EE] text-[#555555] border-[#E5E5E2]';

  switch (variant) {
    case 'success':
      style = 'bg-[#EBF5EE] text-[#1E5631] border-[#C2E0CC]';
      break;
    case 'warning':
      style = 'bg-[#FEF7EC] text-[#975A16] border-[#FBD38D]';
      break;
    case 'danger':
      style = 'bg-[#FDF2F2] text-[#9B1C1C] border-[#F8B4B4]';
      break;
    case 'verified':
      style = 'bg-[#EBF5EE] text-[#1E3A2B] border-[#C2E0CC] font-mono uppercase tracking-wider text-[10px]';
      break;
    case 'predicted':
      style = 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] font-mono uppercase tracking-wider text-[10px]';
      break;
    case 'estimated':
      style = 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] font-mono uppercase tracking-wider text-[10px]';
      break;
    case 'demo':
      style = 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-mono uppercase tracking-wider text-[10px]';
      break;
    default:
      style = 'bg-[#F0F0EE] text-[#444444] border-[#E5E5E2]';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap ${style} ${className}`}
    >
      {children}
    </span>
  );
};
