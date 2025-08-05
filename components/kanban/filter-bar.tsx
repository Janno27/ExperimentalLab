'use client'

import { useState } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { SearchBar } from '@/components/ui/searchBar'

interface MarketRef { id: string; name: string }
interface FilterBarProps {
  markets: MarketRef[]
  roles: string[]
  scopes: string[]
  onFilterChange: (filters: { market: string; role: string; scope: string; search: string }) => void
}

export function FilterBar({ markets, roles, scopes, onFilterChange }: FilterBarProps) {
  const [selectedMarket, setSelectedMarket] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedScope, setSelectedScope] = useState<string>('')
  const [search, setSearch] = useState('')

  function handleChange(next: Partial<{ market: string; role: string; scope: string; search: string }>) {
    const filters = {
      market: next.market ?? selectedMarket,
      role: next.role ?? selectedRole,
      scope: next.scope ?? selectedScope,
      search: next.search ?? search,
    }
    setSelectedMarket(filters.market)
    setSelectedRole(filters.role)
    setSelectedScope(filters.scope)
    setSearch(filters.search)
    onFilterChange(filters)
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center mb-4 w-full">
      <div className="flex gap-2 relative z-50">
        <Listbox value={selectedMarket} onChange={v => handleChange({ market: v })}>
          <ListboxButton className={clsx('relative block min-w-[8rem] max-w-[16rem] w-auto rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 py-1 pr-7 pl-3 text-left text-xs text-zinc-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-0 h-8 cursor-pointer')}>
            {markets.find(m => m.id === selectedMarket)?.name || 'Market'}
            <ChevronDownIcon className="group pointer-events-none absolute top-2 right-2 size-4 fill-zinc-400 dark:fill-white/60" aria-hidden="true" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom"
            transition
            className={clsx(
              'z-50 w-auto min-w-[8rem] max-w-[16rem] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 focus:outline-none shadow-lg',
              'transition-opacity duration-150 ease-out',
              'data-[state=open]:opacity-100',
              'data-[state=closed]:opacity-0'
            )}
          >
            <ListboxOption value="" className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1 select-none text-xs">
              <div className="text-xs text-zinc-400">All</div>
            </ListboxOption>
            {markets.map((market) => (
              <ListboxOption key={market.id} value={market.id} className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1 select-none text-xs data-focus:bg-violet-100 dark:data-focus:bg-violet-700/30">
                <CheckIcon className="invisible size-4 fill-violet-600 dark:fill-white group-data-selected:visible" />
                <div className="text-xs text-zinc-800 dark:text-white">{market.name}</div>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
        <Listbox value={selectedRole} onChange={v => handleChange({ role: v })}>
          <ListboxButton className={clsx('relative block min-w-[8rem] max-w-[16rem] w-auto rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 py-1 pr-7 pl-3 text-left text-xs text-zinc-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-0 h-8 cursor-pointer')}>
            {selectedRole || 'Role'}
            <ChevronDownIcon className="group pointer-events-none absolute top-2 right-2 size-4 fill-zinc-400 dark:fill-white/60" aria-hidden="true" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom"
            transition
            className={clsx(
              'z-50 w-auto min-w-[8rem] max-w-[16rem] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 focus:outline-none shadow-lg',
              'transition-opacity duration-150 ease-out',
              'data-[state=open]:opacity-100',
              'data-[state=closed]:opacity-0'
            )}
          >
            <ListboxOption value="" className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1 select-none text-xs">
              <div className="text-xs text-zinc-400">All</div>
            </ListboxOption>
            {roles.map((role, idx) => (
              <ListboxOption key={role || idx} value={role} className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1 select-none text-xs data-focus:bg-violet-100 dark:data-focus:bg-violet-700/30">
                <CheckIcon className="invisible size-4 fill-violet-600 dark:fill-white group-data-selected:visible" />
                <div className="text-xs text-zinc-800 dark:text-white">{role}</div>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
        <Listbox value={selectedScope} onChange={v => handleChange({ scope: v })}>
          <ListboxButton className={clsx('relative block min-w-[8rem] max-w-[16rem] w-auto rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 py-1 pr-7 pl-3 text-left text-xs text-zinc-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 min-h-0 h-8 cursor-pointer')}>
            {selectedScope || 'Scope'}
            <ChevronDownIcon className="group pointer-events-none absolute top-2 right-2 size-4 fill-zinc-400 dark:fill-white/60" aria-hidden="true" />
          </ListboxButton>
          <ListboxOptions
            anchor="bottom"
            transition
            className={clsx(
              'z-50 w-auto min-w-[8rem] max-w-[16rem] rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 focus:outline-none shadow-lg',
              'transition-opacity duration-150 ease-out',
              'data-[state=open]:opacity-100',
              'data-[state=closed]:opacity-0'
            )}
          >
            <ListboxOption value="" className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1 select-none text-xs">
              <div className="text-xs text-zinc-400">All</div>
            </ListboxOption>
            {scopes.map((scope, idx) => (
              <ListboxOption key={scope || idx} value={scope} className="group flex cursor-pointer items-center gap-2 rounded px-3 py-1 select-none text-xs data-focus:bg-violet-100 dark:data-focus:bg-violet-700/30">
                <CheckIcon className="invisible size-4 fill-violet-600 dark:fill-white group-data-selected:visible" />
                <div className="text-xs text-zinc-800 dark:text-white">{scope}</div>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      </div>
      <div className="flex-1 w-full max-w-xs md:justify-end md:flex md:ml-auto">
        <SearchBar placeholder="Search..." onSearch={v => handleChange({ search: v })} className="bg-white/5" />
      </div>
    </div>
  )
} 