import { useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon } from './icons'
import './select.css'

interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  value: T
  options: SelectOption<T>[]
  onChange: (value: T) => void
}

export function Select<T extends string>({ value, options, onChange }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const selected = options.find((o) => o.value === value)

  const handleBlur = () => {
    blurTimeout.current = setTimeout(() => setOpen(false), 120)
  }

  const handleToggle = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current)
    setOpen((o) => !o)
  }

  const handlePick = (v: T) => {
    onChange(v)
    setOpen(false)
  }

  return (
    <div className="select">
      <button
        type="button"
        className={`select-trigger${open ? ' open' : ''}`}
        onClick={handleToggle}
        onBlur={handleBlur}
      >
        <span>{selected?.label ?? ''}</span>
        <ChevronDownIcon className="select-chevron" />
      </button>

      {open && (
        <ul className="select-dropdown">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                className={o.value === value ? 'active' : ''}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(o.value)}
              >
                <span>{o.label}</span>
                {o.value === value && <CheckIcon className="select-check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
