import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "California Transmission News | CalGrid News",
};

export default function TransmissionPage() {
  return <DashboardView section="transmission" />;
}
