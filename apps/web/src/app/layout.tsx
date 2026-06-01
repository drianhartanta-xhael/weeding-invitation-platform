import type { Metadata } from 'next';
import { Inter, Noto_Sans } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '@/components/ErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";

const notoSans = Noto_Sans({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Wedding Invitation Platform - Admin',
  description: 'Manage your wedding invitations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", notoSans.variable)}>
      <body className={inter.className}>
        <ErrorBoundary>
          {/* TooltipProvider at the root so every route (including statically
              pre-rendered chunks where the dashboard layout's provider isn't
              yet in scope) has a Radix Tooltip context ancestor. */}
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
