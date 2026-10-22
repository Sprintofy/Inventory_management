"use client";

import { StockInDialog } from "@/components/inventory/StockDialogs";

export default function StockInCreatePage() {
  return (
    <StockInDialog open={true} onOpenChange={() => {}} fullPage />
  );
}
