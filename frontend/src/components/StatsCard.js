import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

export const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  trendValue,
  className 
}) => {
  return (
    <Card className={cn("bg-white border-slate-100 hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 font-heading">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "mt-2 text-sm font-medium",
                trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              )}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </div>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary/10 rounded-xl">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
