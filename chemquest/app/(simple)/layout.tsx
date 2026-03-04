export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'ChemQuest Simple Auth',
}

export default function SimpleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
