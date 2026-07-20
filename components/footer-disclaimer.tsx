import Link from 'next/link'

export function FooterDisclaimer() {
  return (
    <p className="pb-2 text-center text-xs text-muted-foreground">
      <Link href="/guidelines" className="underline hover:text-foreground">
        Normas de la comunidad
      </Link>{' '}
      · metoo no sustituye a un profesional. En crisis, llama al{' '}
      <strong>024</strong>.
    </p>
  )
}
