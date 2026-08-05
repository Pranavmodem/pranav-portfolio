import type { Metadata } from "next";
import Dashboard from "./dashboard";

export const metadata: Metadata = {
  title: "Pranav HQ",
  description: "Private tracker: diet, gym, reminders, and a personal AI assistant.",
  robots: { index: false, follow: false },
};

export default function AppPage() {
  return <Dashboard />;
}
