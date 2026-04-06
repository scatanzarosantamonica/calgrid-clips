import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "California Labor News | CalGrid News",
};

export default function LaborPage() {
  return <DashboardView section="labor" />;
}
