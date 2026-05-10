import { forwardRef } from 'react';
import { cn } from '@/lib/cn.js';

export const Input = forwardRef(({ className, ...rest }, ref) => (
  <input ref={ref} className={cn('field-input', className)} {...rest} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cn('field-input min-h-[88px] resize-y', className)} {...rest} />
));
Textarea.displayName = 'Textarea';
