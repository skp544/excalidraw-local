import { forwardRef } from 'react';
import { cn } from '@/lib/cn.js';

const variants = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-500 active:scale-[0.98] focus-ring',
};

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: '',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2 w-9 h-9',
};

export const Button = forwardRef(
  ({ variant = 'primary', size = 'md', className, asChild = false, ...rest }, ref) => {
    const classes = cn(variants[variant], sizes[size], className);
    if (asChild) {
      return <span ref={ref} className={classes} {...rest} />;
    }
    return <button ref={ref} className={classes} {...rest} />;
  },
);
Button.displayName = 'Button';
