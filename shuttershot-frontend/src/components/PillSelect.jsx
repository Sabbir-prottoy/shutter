import { useEffect, useRef, useState } from 'react'

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  )
}

/**
 * A styled replacement for a native <select>: the whole capsule is the click
 * target (icon and chevron included), and the options open as a list of
 * capsules that tint on hover. Keyboard: arrows/Home/End move, Enter or Space
 * picks, Escape closes, and typing jumps to a matching option.
 */
export default function PillSelect({ value, onChange, options, icon, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const typeAhead = useRef({ text: '', timer: null })

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return undefined
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function openList() {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  function choose(index) {
    onChange(options[index].value)
    setOpen(false)
  }

  function handleKeyDown(event) {
    const last = options.length - 1

    if (event.key === 'Tab') {
      setOpen(false)
      return
    }

    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
      }
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openList()
        return
      }
      setActiveIndex((index) =>
        event.key === 'ArrowDown' ? Math.min(index + 1, last) : Math.max(index - 1, 0),
      )
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (open) {
        event.preventDefault()
        setActiveIndex(event.key === 'Home' ? 0 : last)
      }
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) {
        choose(activeIndex)
      } else {
        openList()
      }
      return
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const state = typeAhead.current
      clearTimeout(state.timer)
      state.text += event.key.toLowerCase()
      state.timer = setTimeout(() => {
        state.text = ''
      }, 600)

      const match = options.findIndex((option) => option.label.toLowerCase().startsWith(state.text))
      if (match >= 0) {
        if (!open) setOpen(true)
        setActiveIndex(match)
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`pill-focus flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-raised ${
          open ? 'bg-surface-raised' : ''
        }`}
      >
        {icon}
        <span className="whitespace-nowrap pr-1">{selected.label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-50 mt-2 max-h-72 w-max min-w-full max-w-[18rem] space-y-1 overflow-y-auto rounded-3xl border border-border bg-surface p-2 shadow-hover [scrollbar-width:thin]"
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex
            const isActive = index === activeIndex
            return (
              <li
                key={option.value || '__any'}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
                className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-accent-gradient font-medium text-white'
                    : isActive
                      ? 'bg-accent/15 text-accent'
                      : 'text-ink'
                }`}
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
