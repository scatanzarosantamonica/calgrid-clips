import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "California Energy News | CalGrid News",
};

export default function EnergyPage() {
  return <DashboardView section="energy" />;
}
