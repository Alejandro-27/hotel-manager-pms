import { describe, it, expect } from 'vitest'
import { applyDialPrefix, countryByCode, countries, filterCountry } from './countries'

describe('countries', () => {
  it('tiene codigos unicos y prefijo en los paises habituales', () => {
    expect(new Set(countries.map((c) => c.code)).size).toBe(countries.length)
    expect(countryByCode.ES.dial).toBe('+34')
    expect(countryByCode.US.dial).toBe('+1')
    expect(countryByCode.MX.dial).toBe('+52')
  })
})

describe('filterCountry', () => {
  it('muestra todo cuando la busqueda esta vacia', () => {
    expect(filterCountry('Espana ES +34', '')).toBe(1)
  })

  it('encuentra por nombre parcial', () => {
    expect(filterCountry('Espana ES +34', 'esp')).toBe(1)
    expect(filterCountry('Espana ES +34', 'pana')).toBe(1)
  })

  it('ignora acentos en la busqueda', () => {
    expect(filterCountry('Espana ES +34', 'España')).toBe(1)
    expect(filterCountry('Mexico MX +52', 'méx')).toBe(1)
  })

  it('encuentra por codigo ISO', () => {
    expect(filterCountry('Colombia CO +57', 'co')).toBe(1)
  })

  it('exige que todas las palabras coincidan', () => {
    expect(filterCountry('Costa Rica CR +506', 'costa rica')).toBe(1)
    expect(filterCountry('Costa Rica CR +506', 'costa ricaa')).toBe(0)
  })
})

describe('applyDialPrefix', () => {
  it('antepone el prefijo a un telefono nacional', () => {
    expect(applyDialPrefix('600123456', '+34')).toBe('+34 600123456')
  })

  it('cambia el prefijo existente al cambiar de pais', () => {
    expect(applyDialPrefix('+34 600123456', '+52')).toBe('+52 600123456')
  })

  it('quita el prefijo aunque no haya espacio', () => {
    expect(applyDialPrefix('+34600123456', '+52')).toBe('+52 600123456')
  })

  it('sustituye prefijos de varios digitos sin comerse el numero', () => {
    expect(applyDialPrefix('+358181234567', '+34')).toBe('+34 1234567')
  })

  it('deja solo el prefijo si el telefono esta vacio', () => {
    expect(applyDialPrefix('', '+34')).toBe('+34 ')
  })

  it('devuelve el numero tal cual si el pais no tiene prefijo', () => {
    expect(applyDialPrefix('600123456', '')).toBe('600123456')
  })
})
