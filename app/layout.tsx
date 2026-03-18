import './globals.css';
import { SupabaseAuthProvider } from './auth/supabase-provider';
import { Toaster } from 'sonner';

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'ChemQuest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SupabaseAuthProvider>
          {children}
        </SupabaseAuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
