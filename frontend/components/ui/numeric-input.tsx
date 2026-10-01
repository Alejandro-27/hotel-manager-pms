"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn, isBlockedNumberKey, sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/utils"

type NumericMode = "decimal" | "integer"

interface NumericInputProps
  extends Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange" | "inputMode"> {
  value: string
  onValueChange: (value: string) => void
  mode?: NumericMode
}

export function NumericInput({
  value,
  onValueChange,
  mode = "decimal",
  className,
  onKeyDown,
  onBlur,
  "aria-invalid": ariaInvalid,
  ...props
}: NumericInputProps) {
  const [error, setError] = React.useState<string | null>(null)

  const message =
    mode === "integer" ? "Solo se permiten numeros enteros" : "Solo se permiten numeros"

  React.useEffect(() => {
    if (!error) return
    const timeout = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(timeout)
  }, [error])

  function isAllowedChar(key: string) {
    if (key >= "0" && key <= "9") return true
    if (mode === "decimal" && (key === "." || key === ",")) return true
    return false
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (isBlockedNumberKey(event.key)) {
      event.preventDefault()
      setError(message)
      return
    }
    if (event.key.length !== 1) return
    if (isAllowedChar(event.key)) setError(null)
    else {
      event.preventDefault()
      setError(message)
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    const sanitized = mode === "integer" ? sanitizeIntegerInput(raw) : sanitizeDecimalInput(raw)
    const normalized = mode === "integer" ? raw : raw.replace(",", ".")
    setError(sanitized === normalized ? null : message)
    onValueChange(sanitized)
  }

  return (
    <>
      <Input
        {...props}
        type="number"
        inputMode={mode === "decimal" ? "decimal" : "numeric"}
        value={value}
        aria-invalid={error ? true : ariaInvalid}
        className={cn(className, error && "border-destructive focus-visible:ring-destructive")}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={onBlur}
      />
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </>
  )
}
