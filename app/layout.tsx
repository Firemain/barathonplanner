import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Barathon Planner 🍻',
  description: 'Planifie ton bar crawl parfait entre deux adresses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}