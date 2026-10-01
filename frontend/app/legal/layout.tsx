import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Informacion legal",
  robots: { index: false, follow: true },
}

const links = [
  { href: "/legal/privacidad", label: "Politica de privacidad" },
  { href: "/legal/terminos", label: "Terminos y condiciones" },
  { href: "/legal/reembolsos", label: "Cancelacion y reembolsos" },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">HotelManager PMS</p>
          <nav aria-label="Informacion legal" className="flex flex-wrap gap-x-4 gap-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenido-principal" tabIndex={-1} className="mx-auto max-w-3xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}