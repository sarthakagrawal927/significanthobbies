import "~/app/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Providers } from "~/components/providers";
import { Nav } from "~/components/nav";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "SignificantHobbies — Your Hobby Journey",
    template: "%s | SignificantHobbies",
  },
  description:
    "Map your hobby history across life phases. Discover insights. Find what to explore next.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} min-h-screen bg-slate-950 text-slate-100`}>
        <Providers>
          <Nav />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
