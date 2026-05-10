import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo.jsx';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative min-h-full overflow-hidden bg-canvas-light dark:bg-canvas-dark">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violetx-300/40 blur-3xl dark:bg-violetx-700/30" />
        <div className="absolute right-[-160px] top-1/3 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-700/20" />
        <div className="absolute bottom-[-160px] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-200/30 blur-3xl dark:bg-rose-700/15" />
        <div className="absolute inset-0 grid-bg-light opacity-60 dark:hidden" />
        <div className="absolute inset-0 hidden grid-bg-dark opacity-50 dark:block" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.21, 1.02, 0.73, 1] }}
          className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-ink-200/70 bg-white/80 shadow-ring backdrop-blur-xl dark:border-ink-700/60 dark:bg-ink-900/70 lg:grid-cols-[1.05fr_1fr]"
        >
          <aside className="relative hidden overflow-hidden border-r border-ink-200/70 bg-gradient-to-br from-violetx-600 via-violetx-700 to-indigo-800 p-10 text-white dark:border-ink-700/60 lg:block">
            <Logo className="text-white" />
            <h1 className="mt-12 max-w-sm font-display text-3xl font-semibold leading-tight tracking-tight">
              Your private studio for thinking visually.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-violetx-100">
              Excalidrow runs entirely on your machine. Sketch, diagram, and architect — without
              shipping a single byte to the cloud.
            </p>

            <ul className="mt-8 space-y-3 text-sm text-violetx-100">
              {[
                'Infinite canvas powered by Excalidraw',
                'Local file storage — no Cloudinary, no AWS',
                'CRDT-ready realtime architecture',
                'Built for your workflow, dark-mode first',
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[11px]">✓</span>
                  {line}
                </li>
              ))}
            </ul>

            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          </aside>

          <main className="flex flex-col justify-center px-8 py-10 sm:px-12">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Logo />
            </div>
            <div className="max-w-sm">
              <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
              {subtitle && (
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
              )}
              <div className="mt-6">{children}</div>
            </div>
          </main>
        </motion.div>
      </div>
    </div>
  );
}
