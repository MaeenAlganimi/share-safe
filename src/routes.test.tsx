import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { getPageForPath } from './routes'
import Landing from './ui/Landing'

describe('site routes', () => {
  it('serves the landing page at root and the redactor at /app', () => {
    expect(getPageForPath('/')).toBe('landing')
    expect(getPageForPath('/app')).toBe('app')
    expect(getPageForPath('/app/')).toBe('app')
    expect(getPageForPath('/app', 'sharesafe:')).toBe('app')
  })

  it('renders the privacy model, FAQ, screenshots, and desktop downloads', () => {
    const html = renderToStaticMarkup(<Landing />)
    expect(html).toContain('Nothing leaves')
    expect(html).toContain('A few clear answers.')
    expect(html).toContain('/screenshots/share-safe-demo.png')
    expect(html).toContain('FREE DESKTOP DOWNLOAD')
  })
})
