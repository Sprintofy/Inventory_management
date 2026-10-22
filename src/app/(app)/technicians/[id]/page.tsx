"use client";

import { use } from "react";
import { TechnicianDetailView } from "@/components/technicians/TechnicianDetailView";

export default function TechnicianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TechnicianDetailView id={id} />;
}