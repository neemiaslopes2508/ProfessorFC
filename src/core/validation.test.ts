import { describe, expect, it } from 'vitest'
import { assertDate } from './validation'

describe('Datas civis canônicas', () => {
  it.each(['2026-01-01', '2028-02-29', '0001-01-01', '9999-12-31'])(
    'aceita %s', value => expect(() => assertDate(value, 'Data')).not.toThrow(),
  )
  it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-01-00', '0000-01-01', '2026-1-1', '2026-01-01T00:00:00Z', 'inválida'])(
    'rejeita %s', value => expect(() => assertDate(value, 'Data')).toThrow(),
  )
})
