import { useState, useEffect, useRef } from "react"

interface AutocompleteInputProps {
  value: string
  onChange: (val: string) => void
  voucher: string
  type: string
  placeholder?: string
  required?: boolean
}

export default function AutocompleteInput({ value, onChange, voucher, type, placeholder = "", required = false }: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL

  // Fetch suggestions when user types
  useEffect(() => {
    if (!value) {
      setSuggestions([])
      return
    }

    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`${LARAVEL_API_URL}/autocomplete?voucher=${voucher}&field=${type}&query=${value}`)
        const data = await res.json()
        setSuggestions(data)
      } catch (error) {
        console.error("Autocomplete fetch error:", error)
      }
    }, 300) // debounce for 300ms

    // Cleanup previous timeout if value changes quickly
    return () => clearTimeout(handler)
  }, [value, type, LARAVEL_API_URL])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (val: string) => {
    onChange(val) // fill input
    setShowDropdown(false) // close dropdown
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setShowDropdown(true)
        }}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
        autoComplete="off"
        required={required}
      />

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute bg-white border w-full mt-1 rounded shadow max-h-40 overflow-auto z-10">
          {suggestions.map((s) => (
            <li key={s} className="p-2 hover:bg-gray-200 cursor-pointer" onClick={() => handleSelect(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
