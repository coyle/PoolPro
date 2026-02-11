import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
          <div className="container flex items-center justify-between py-3">
            <Link href="/" className="font-semibold">Pool Pro LLM</Link>
            <Link href="/dashboard" className="text-sm text-blue-700">Dashboard</Link>
          </div>
        </header>
        <main className="container py-4">{children}</main>
      </body>
    </html>
  );
}
