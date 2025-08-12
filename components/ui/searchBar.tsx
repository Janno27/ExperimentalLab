"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { InputHTMLAttributes } from "react"

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  placeholder?: string
  className?: string
  onSearch?: (value: string) => void
}

export function SearchBar({ 
  placeholder = "Search...", 
  className = "",
  onSearch,
  onChange,
  ...props 
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    onSearch?.(e.target.value)
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <Input
        placeholder={placeholder}
        className="pl-10 rounded-2xl border border-gray-200 focus:border-gray-300 focus:outline-none transition-all duration-200 hover:border-gray-300"
        onChange={handleChange}
        {...props}
      />
    </div>
  )
} 