import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };

export function Button({ variant = 'primary', className = '', ...rest }: Props) {
  const base =
    'num flex h-14 w-full items-center justify-center rounded-xl text-lg transition-transform active:scale-[0.98]';
  const look =
    variant === 'primary'
      ? 'border-2 border-edge bg-accent text-on-accent [box-shadow:var(--btn-shadow)]'
      : 'border-2 border-text bg-transparent text-text';
  return <button type="button" className={`${base} ${look} ${className}`} {...rest} />;
}
