'use client'

import { ThemeProvider } from '@/lib/theme-context'

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
