import Link from 'next/link'

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={`border-t border-border px-6 py-8 ${className ?? ''}`}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <span className="font-semibold text-foreground">metoo.</span>
        <span>
          © 2026 metoo. Hecho con cuidado por{' '}
          <a
            href="https://bay-apps.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Bay Apps
          </a>
        </span>
        <div className="flex gap-6">
          <Link href="/privacidad" className="transition-colors hover:text-foreground">
            Privacidad
          </Link>
          <Link href="/terminos" className="transition-colors hover:text-foreground">
            Términos
          </Link>
          <a href="mailto:juan@bay-apps.com" className="transition-colors hover:text-foreground">
            Contacto
          </a>
        </div>
      </div>
    </footer>
  )
}
