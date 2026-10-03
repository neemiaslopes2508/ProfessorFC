import { expect, it } from 'vitest'
import { createSeededRandomSource, deriveSeed } from './random'

it('mantém a sequência de gameplay intacta ao consumir o stream determinístico de lesões', () => {
  const matchSeed = 2026
  const gameplay = createSeededRandomSource(matchSeed)
  const untouched = createSeededRandomSource(matchSeed)
  const injuries = gameplay.fork!('injuries')
  const repeatedInjuries = createSeededRandomSource(deriveSeed(matchSeed, 'injuries'))

  expect(Array.from({ length: 20 }, () => injuries.next())).toEqual(Array.from({ length: 20 }, () => repeatedInjuries.next()))
  expect(gameplay.next()).toBe(untouched.next())
})
