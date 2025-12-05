
import type {Metadata} from 'next';
import { Inter } from "next/font/google";
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from '@/components/app/settings/theme-provider';
import { DataProvider } from '@/lib/data-context';
import { AuthProvider } from '@/lib/auth-context';
import { FirebaseProvider } from '@/lib/firebase-provider';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: 'CloudPOS',
  description: 'A modern cloud-based Point of Sale system.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseProvider>
            <AuthProvider>
              <DataProvider>
                {children}
                <Toaster />
              </DataProvider>
            </AuthProvider>
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
