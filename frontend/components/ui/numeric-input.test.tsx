import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { NumericInput } from './numeric-input'

function Harness(props: { mode?: 'decimal' | 'integer'; onValueChange?: (value: string) => void }) {
  const [value, setValue] = React.useState('')
  return (
    <NumericInput
      aria-label="importe"
      mode={props.mode}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        props.onValueChange?.(next)
      }}
    />
  )
}

describe('NumericInput', () => {
  it('warns when a letter is pressed and clears it on a valid digit', () => {
    render(<Harness />)
    const input = screen.getByLabelText('importe')

    fireEvent.keyDown(input, { key: 'a' })
    expect(screen.getByRole('alert')).toHaveTextContent('Solo se permiten numeros')

    fireEvent.keyDown(input, { key: '5' })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('blocks exponent and sign keys', () => {
    render(<Harness />)
    const input = screen.getByLabelText('importe')

    for (const key of ['e', 'E', '+', '-']) {
      fireEvent.keyDown(input, { key })
      expect(screen.getByRole('alert')).toBeInTheDocument()
    }
  })

  it('reports the sanitized value on change', () => {
    const onValueChange = vi.fn()
    render(<Harness onValueChange={onValueChange} />)
    const input = screen.getByLabelText('importe')

    fireEvent.change(input, { target: { value: '123' } })
    expect(onValueChange).toHaveBeenLastCalledWith('123')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('accepts decimals in decimal mode and rejects them in integer mode', () => {
    const { unmount } = render(<Harness mode="decimal" />)
    fireEvent.keyDown(screen.getByLabelText('importe'), { key: '.' })
    expect(screen.queryByRole('alert')).toBeNull()
    unmount()

    render(<Harness mode="integer" />)
    fireEvent.keyDown(screen.getByLabelText('importe'), { key: '.' })
    expect(screen.getByRole('alert')).toHaveTextContent('Solo se permiten numeros enteros')
  })
})
