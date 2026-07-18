export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background py-6 text-center text-xs text-muted-foreground">
      <p className="font-medium text-foreground/70">Bay Apps</p>
      <p className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a
          href="https://bay-apps.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          bay-apps.com
        </a>
        <span className="text-border">·</span>
        <a
          href="mailto:juan@bay-apps.com"
          className="hover:text-foreground hover:underline"
        >
          juan@bay-apps.com
        </a>
      </p>
    </footer>
  )
}
