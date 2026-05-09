import type { Metadata } from "next";
import { Archivo } from 'next/font/google';
import { Toaster } from "sonner";
import './globals.css';
import "flatpickr/dist/flatpickr.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo-src",
});

// Wired through metadata.icons (rather than a colocated app/icon.svg
// or app/favicon.ico) so we sidestep the @vercel/og Windows path bug
// the metadata-image-loader hit on earlier builds.
export const metadata: Metadata = {
  icons: {
    icon: "/images/LMS_FavIcon.ico",
    shortcut: "/images/LMS_FavIcon.ico",
    apple: "/images/LMS_FavIcon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={archivo.variable}>
      <body className="font-archivo">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={5000}
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-gray-200 shadow-theme-md bg-white",
              title: "text-gray-800 font-semibold",
              description: "text-gray-600",
              error: "border-error-200",
              success: "border-success-200",
            },
          }}
        />
      </body>
    </html>
  );
}
