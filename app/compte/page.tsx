import type { Metadata } from "next";
import { AccountView } from "@/components/AccountView";
import { DemoNotice } from "@/components/DemoNotice";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export default function Compte() {
  return (
    <section className="container-x py-16">
      <h1 className="h-section mb-8 text-4xl sm:text-5xl">Mon compte</h1>
      <DemoNotice />
      <AccountView />
    </section>
  );
}
