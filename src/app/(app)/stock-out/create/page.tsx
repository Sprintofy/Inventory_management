"use client";

import { StockOutDialog } from "@/components/inventory/StockDialogs";

export default function StockOutCreatePage() {
  return (
    <StockOutDialog open={true} onOpenChange={() => {}} fullPage />
  );
}
