import { describe, it, expect } from 'vitest'
import { temasSinAcompanante } from '@/lib/avisos'

const t = (hashtag_id: string, role: string | null) => ({ hashtag_id, role })

describe('temasSinAcompanante', () => {
  it('devuelve mis temas de buscar apoyo en los que no acompaña nadie', () => {
    const mios = [t('duelo', 'seeker'), t('prem', 'seeker'), t('cancer', 'volunteer')]
    const voluntarios = [{ profile_hashtags: [t('prem', 'volunteer')] }]

    expect(temasSinAcompanante(mios, voluntarios).map((x) => x.hashtag_id)).toEqual(['duelo'])
  })

  it('alguien que BUSCA apoyo en mi tema no cuenta como acompañante', () => {
    const mios = [t('duelo', 'seeker')]
    const voluntarios = [{ profile_hashtags: [t('duelo', 'seeker'), t('prem', 'volunteer')] }]

    expect(temasSinAcompanante(mios, voluntarios).map((x) => x.hashtag_id)).toEqual(['duelo'])
  })

  it('los temas en los que acompaño yo no se ofrecen', () => {
    expect(temasSinAcompanante([t('prem', 'volunteer')], [])).toEqual([])
  })
})
