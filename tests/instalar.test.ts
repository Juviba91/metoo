import { describe, it, expect } from 'vitest'
import { plataformaDeInstalacion } from '@/lib/instalar'

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const ESCRITORIO = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

describe('plataformaDeInstalacion', () => {
  it('iPhone en Safari: hay que explicar el camino', () => {
    expect(plataformaDeInstalacion({ ua: IPHONE, maxTouchPoints: 5, standalone: false })).toBe('ios')
  })
  it('iPad, que se presenta como Mac, se reconoce por la pantalla táctil', () => {
    expect(plataformaDeInstalacion({ ua: IPAD, maxTouchPoints: 5, standalone: false })).toBe('ios')
  })
  it('un Mac de verdad es escritorio', () => {
    expect(plataformaDeInstalacion({ ua: IPAD, maxTouchPoints: 0, standalone: false })).toBe('escritorio')
  })
  it('Android', () => {
    expect(plataformaDeInstalacion({ ua: ANDROID, maxTouchPoints: 5, standalone: false })).toBe('android')
  })
  it('en el ordenador no se recomienda', () => {
    expect(plataformaDeInstalacion({ ua: ESCRITORIO, maxTouchPoints: 0, standalone: false })).toBe('escritorio')
  })
  it('si ya se abre desde la pantalla de inicio, no se repite', () => {
    expect(plataformaDeInstalacion({ ua: IPHONE, maxTouchPoints: 5, standalone: true })).toBe('instalada')
    expect(plataformaDeInstalacion({ ua: ANDROID, maxTouchPoints: 5, standalone: true })).toBe('instalada')
  })
})
