import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Local Coverage | CalGrid News",
};

export default function LocalPage() {
  return <DashboardView section="local" />;
}
