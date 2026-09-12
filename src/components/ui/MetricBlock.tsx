import React from 'react';

interface MetricBlockProps {
  label: string;
  value: string | number;
  subtext?: string;
  badge?: {
    text: string;
    variant?: 'success' | 'warning' | 'danger' | 'neutral';
  };
  classificationTag?: 'VERIFIED' | 'PREDICTED' | 'ESTIMATED';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
    isGood?: boolean;
  };
  className?: string;
}

export const MetricBlock: React.FC<MetricBlockProps> = ({
  label,
  value,
  subtext,
  badge,
  classificationTag,
  trend,
  className = ''
}) => {
  return (
    <div
      className={`bg-white border border-[#E5E5E2] rounded-lg p-4 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-[#666666] tracking-tight">{label}</span>
        {classificationTag && (
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#F0F0EE] text-[#555555] border border-[#E5E5E2]">
            {classificationTag}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl lg:text-[28px] font-semibold text-[#171717] tracking-tight">
          {value}
        </span>
        {badge && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              badge.variant === 'success'
                ? 'bg-[#EBF5EE] text-[#1E5631]'
                : badge.variant === 'warning'
                ? 'bg-[#FEF7EC] text-[#975A16]'
                : badge.variant === 'danger'
                ? 'bg-[#FDF2F2] text-[#9B1C1C]'
                : 'bg-[#F0F0EE] text-[#555555]'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2 text-xs text-[#666666] flex items-center gap-1.5">
          {trend && (
            <span
              className={`font-medium ${
                trend.isGood === true
                  ? 'text-[#1E5631]'
                  : trend.isGood === false
                  ? 'text-[#9B1C1C]'
                  : 'text-[#666666]'
              }`}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};
