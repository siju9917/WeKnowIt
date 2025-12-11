import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WeKnowIt",
  description:
    "The Reddit of AI Chatbots, where humans guide and provide the core data and knowledge.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/threads" className="site-brand">
              <div className="site-title-main">WeKnowIt</div>
              <div className="site-tagline">
                The Reddit of AI Chatbots, where humans guide and provide the
                core data and knowledge. With information never so easy to
                access in today&apos;s day and age, it is important AI is used
                in a way that encourages truth, interdisciplinary collaboration
                and knowledge access, and human monitoring/interaction with core
                training data to the models we are using.
              </div>
            </Link>
            <Link href="/threads" className="site-home-link">
              Home
            </Link>
          </header>
          <main className="site-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
