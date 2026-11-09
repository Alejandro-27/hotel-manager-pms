"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { countries, filterCountry, type Country } from "@/lib/countries"

interface CountryComboboxProps {
  id?: string
  value: string
  onValueChange: (country: Country) => void
  placeholder?: string
  className?: string
}

export function CountryCombobox({
  id,
  value,
  onValueChange,
  placeholder = "Selecciona pais",
  className,
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = countries.find((country) => country.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selected
              ? selected.dial
                ? `${selected.name} (${selected.dial})`
                : selected.name
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command filter={filterCountry}>
          <CommandInput placeholder="Buscar pais por nombre o codigo..." />
          <CommandList>
            <CommandEmpty>Sin resultados</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code} ${country.dial}`}
                  onSelect={() => {
                    onValueChange(country)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{country.name}</span>
                  {country.dial && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {country.dial}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
