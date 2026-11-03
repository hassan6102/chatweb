import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-2">
        <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-border bg-surface-raised p-12 lg:flex xl:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 top-20 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-48 -left-36 h-[34rem] w-[34rem] rounded-full border border-accent/10"
          />

          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-lg shadow-accent/15">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path
                    d="M5 18.5 6.2 15A7.5 7.5 0 1 1 9 18.2L5 18.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9 10h6M9 13.5h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <span className="text-lg font-semibold tracking-tight text-ink">Chat</span>
            </div>
          </div>

          <div className="relative max-w-xl py-16">
            <div className="mb-7 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-8 bg-accent" />
              Private conversations, made simple
            </div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.12] tracking-tight text-ink xl:text-6xl">
              A quieter space for the conversations that matter.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-ink-muted">
              Find people by their unique ID and stay connected in a private, focused space.
            </p>

            <div
              aria-hidden="true"
              className="mt-12 max-w-sm rounded-2xl border border-border bg-surface/80 p-4 shadow-2xl shadow-black/10 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                  C
                </span>
                <div className="min-w-0 flex-1">
                  <div className="h-2.5 w-24 rounded-full bg-ink/15" />
                  <div className="mt-2 h-2 w-36 rounded-full bg-ink/10" />
                </div>
                <span className="h-2 w-2 rounded-full bg-online" />
              </div>
              <div className="ml-auto mt-4 w-3/4 rounded-2xl rounded-br-md bg-accent/15 px-4 py-3">
                <div className="h-2 w-full rounded-full bg-accent/35" />
                <div className="mt-2 h-2 w-2/3 rounded-full bg-accent/25" />
              </div>
              <div className="mt-3 w-2/3 rounded-2xl rounded-bl-md bg-surface-sunken px-4 py-3">
                <div className="h-2 w-full rounded-full bg-ink/15" />
                <div className="mt-2 h-2 w-1/2 rounded-full bg-ink/10" />
              </div>
            </div>
          </div>

          <p className="relative text-xs text-ink-faint">Your conversations stay yours.</p>
        </aside>

        <main className="flex min-h-dvh flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-[420px]">
            <div className="mb-8 flex flex-col items-center gap-2 text-center lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-lg shadow-accent/15">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path
                    d="M5 18.5 6.2 15A7.5 7.5 0 1 1 9 18.2L5 18.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path d="M9 10h6M9 13.5h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <p className="text-sm text-ink-muted">Private conversations, made simple.</p>
            </div>

            <section className="rounded-2xl border border-border bg-surface-raised p-6 shadow-2xl shadow-black/10 sm:p-8">
              {children}
            </section>
            <p className="mt-6 text-center text-xs text-ink-faint">
              Message people using their User ID — nothing else to share.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
