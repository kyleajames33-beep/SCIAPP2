import './globals.css';

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
        {children}
      </body>
    </html>
  )
}
