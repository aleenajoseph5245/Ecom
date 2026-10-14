import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "form & field — Thoughtful things for living", description: "Considered furniture and objects for a home that feels like yours." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
