import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HomePage } from './HomePage'

describe('Bootstrap da interface', () => {
  it('processa TypeScript/JSX e renderiza a apresentação inicial', () => {
    const markup = renderToStaticMarkup(<HomePage />)

    expect(markup).toContain('<h1>Professor FC</h1>')
    expect(markup).toContain(
      '<p>Gerenciador de futebol em desenvolvimento</p>',
    )
  })
})
