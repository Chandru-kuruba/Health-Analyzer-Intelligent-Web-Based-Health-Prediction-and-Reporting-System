import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export const RiskBadge = ({ level, size = 'default', showIcon = true }) => {
  // Normalize level to lowercase for comparison
  const normalizedLevel = (level || 'low').toLowerCase();
  
  const variants = {
    low: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      icon: CheckCircle2,
      label: 'Low Risk'
    },
    moderate: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      icon: AlertTriangle,
      label: 'Moderate Risk'
    },
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertCircle,
      label: 'High Risk'
    }
  };

  const sizes = {
    small: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    small: 'h-3 w-3',
    default: 'h-4 w-4',
    large: 'h-5 w-5'
  };

  const variant = variants[normalizedLevel] || variants.low;
  const Icon = variant.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border',
        variant.bg,
        variant.border,
        variant.text,
        sizes[size]
      )}
      data-testid={`risk-badge-${normalizedLevel}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {variant.label}
    </span>
  );
};

export const RiskIndicator = ({ level }) => {
  const normalizedLevel = (level || 'low').toLowerCase();
  
  const colors = {
    low: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    high: 'bg-red-500'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-3 w-3 rounded-full', colors[normalizedLevel] || colors.low)} />
      <span className="text-sm font-medium capitalize">{normalizedLevel} Risk</span>
    </div>
  );
};
