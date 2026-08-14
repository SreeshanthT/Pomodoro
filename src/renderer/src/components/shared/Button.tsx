import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export function Button({ variant = 'secondary', className, children, ...rest }: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-secondary'
  return (
    <button className={['btn', variantClass, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  )
}
