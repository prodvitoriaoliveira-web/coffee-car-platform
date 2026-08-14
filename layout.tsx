import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Coffee Car — Gestão",
  description: "Plataforma de gestão de eventos, custos, financeiro e staff do Coffee Car",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="pt-BR">
      <body>
        {session?.user && <Nav userName={session.user.name} />}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
