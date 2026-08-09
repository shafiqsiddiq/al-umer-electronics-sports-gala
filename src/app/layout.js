import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthRedirect from "@/components/AuthRedirect";
import OverlayChromeHider from "@/components/OverlayChromeHider";
import HideWhenLoggedIn from "@/components/HideWhenLoggedIn";

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
            <AuthRedirect />
            <OverlayChromeHider>
              <Navbar />
            </OverlayChromeHider>
            <main className="flex-1">{children}</main>
            <OverlayChromeHider>
              <HideWhenLoggedIn>
                <Footer />
              </HideWhenLoggedIn>
            </OverlayChromeHider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
