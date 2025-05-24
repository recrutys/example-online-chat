import "./globals.css";
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import React from "react";
import {Notices} from "@/components/ui/Notice";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Online chat"
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>)
{
    return (
        <html lang="en">
            <body className={inter.className} id="NT">
                {children}

                <Notices />
            </body>
        </html>
    );
}
