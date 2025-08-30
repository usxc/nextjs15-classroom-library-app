import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = { title: "Classroom Library" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="min-h-dvh bg-white text-gray-900">{children}</body>
      </html>
    </ClerkProvider>
  );
}
