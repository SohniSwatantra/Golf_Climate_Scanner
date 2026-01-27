import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GolfClimate - Climate Risk Scanner for Golf Courses',
  description: 'Analyze flood risk, heat stress, drought vulnerability, and soil subsidence for any golf course in the Netherlands.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
