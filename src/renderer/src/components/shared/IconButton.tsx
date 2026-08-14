import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  children: ReactNode
}

export function IconButton({ label, className, children, ...rest }: IconButtonProps) {
  return (
    <button className={['icon-btn', className].filter(Boolean).join(' ')} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  )
}
