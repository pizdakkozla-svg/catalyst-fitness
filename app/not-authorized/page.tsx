import Link from 'next/link'

export const metadata = { title: 'Access denied · Catalyst Fitness' }

export default function NotAuthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16">
      <div className="glass-card mx-auto w-full max-w-md text-center">
        <p className="eyebrow">403 · Restricted</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-balance">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground text-pretty">
          {"This area is reserved for coaching staff. Your account doesn't have permission to view the admin dashboard."}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Go to my dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border font-mono text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
