"use client"

import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { InputHTMLAttributes } from "react"

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  placeholder?: string
  className?: string
  onSearch?: (value: string) => void
  onClear?: () => void
  showClearButton?: boolean
}

export function SearchBar({ 
  placeholder = "Search...", 
  className = "",
  onSearch,
  onClear,
  showClearButton = false,
  onChange,
  value,
  ...props 
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onSearch?.(e.target.value)
  }

  const handleClear = () => {
    onClear?.()
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        placeholder={placeholder}
        className={`pl-10 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 hover:border-primary/60 hover:bg-accent/50 focus-visible:ring-violet-500/30 ${
          showClearButton && value ? 'pr-10' : ''
        }`}
        onChange={handleChange}
        value={value}
        {...props}
      />
      {showClearButton && value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
          type="button"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
} 