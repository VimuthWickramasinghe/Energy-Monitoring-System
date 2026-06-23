import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EMS Account Access",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
