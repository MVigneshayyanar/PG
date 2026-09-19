import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PGM - Smart PG Management & Rental Directory",
  description:
    "Production-ready PG management portal. Find vacant rooms, manage properties, collect rent via Razorpay, and verify tenant rental ratings & blackmarks.",
  keywords: ["PGM", "PG Management", "Hostel Vacancy Directory", "Tenant History", "Razorpay Rent"],
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body
        className="font-sans antialiased bg-[#f1f7f2] text-[#072e18] min-h-screen selection:bg-[#ff6b00] selection:text-white"
      >
        {children}
      </body>
    </html>
  );
}
