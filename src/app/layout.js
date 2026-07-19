import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RegisterModal from "@/components/RegisterModal";

export const metadata = {
  title: "Cricket Tournament",
  description: "48-team cricket tournament with knockout sections and second chance bracket",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <RegisterModal />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
