"use client";

import * as React from "react";
import Link from "next/link";
import { PackageMinus, ArrowLeft, Clock, User, CheckCircle2, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatNumber } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import jsPDF from "jspdf";

export default function StockOutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: recordId } = React.use(params);

  const { state, stockOut } = useApp();

  const record = state.stockInRecords.find((r) => String(r.id) === recordId);

  const [remarks, setRemarks] = React.useState(record?.remarks ?? "");
  const [technicianName, setTechnicianName] = React.useState(record?.technicianName ?? "");
  const [secIcName, setSecIcName] = React.useState(record?.secIcName ?? "");
  const [defect, setDefect] = React.useState(record?.defect ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  if (!record) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Stock-in record not found.</p>
          <Button
            asChild
            variant="outline"
            onClick={() => {
              window.location.href = "/stock-in";
            }}
          >
            Back to Stock In
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error("Remarks are required before stocking out");
      return;
    }
    if (!technicianName.trim()) {
      toast.error("Technician Name is required before stocking out");
      return;
    }
    if (!secIcName.trim()) {
      toast.error("Name of Sec I/c is required before stocking out");
      return;
    }
    setSubmitting(true);
    try {
      await stockOut(recordId, remarks.trim(), technicianName.trim(), secIcName.trim());
      setSubmitted(true);
      toast.success("Stock issued successfully");
    } catch {
      // toast handled by store
    } finally {
      setSubmitting(false);
    }
  };

  const generateJobCardPDF = () => {
    if (!record) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    }) as any;

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("JOB CARD", pageWidth / 2, 20, { align: "center" });

    // Job Card Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Work Order Id:", margin, 35);
    doc.setFont("helvetica", "normal");
    doc.text(record.workOrderId, margin + 35, 35);

    doc.setFont("helvetica", "bold");
    doc.text("Date:", margin, 42);
    doc.setFont("helvetica", "normal");
    doc.text(record.dateIn, margin + 15, 42);

    // Table header
    const tableStartY = 55;
    const colX: Record<string, number> = {
      sNo: margin,
      defect: margin + 15,
      workDone: margin + 55,
      spareUsed: margin + 110,
      remarks: margin + 145,
    };

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("S/No", colX.sNo, tableStartY);
    doc.text("Defect", colX.defect, tableStartY);
    doc.text("Work Done", colX.workDone, tableStartY);
    doc.text("Spare Used", colX.spareUsed, tableStartY);
    doc.text("Remarks", colX.remarks, tableStartY);

    // Table row
    doc.setFont("helvetica", "normal");
    doc.text("1", colX.sNo, tableStartY + 10);
    doc.text(record.defect ?? "-", colX.defect, tableStartY + 10);
    doc.text(remarks || "-", colX.workDone, tableStartY + 10);
    doc.text("-", colX.spareUsed, tableStartY + 10);
    doc.text("S", colX.remarks, tableStartY + 10);

    // Draw table borders
    const tableTop = tableStartY - 5;
    const tableBottom = tableStartY + 15;
    doc.rect(margin, tableTop, pageWidth - margin * 2, tableBottom - tableTop);

    // Vertical lines
    doc.line(colX.defect - 5, tableTop, colX.defect - 5, tableBottom);
    doc.line(colX.workDone - 5, tableTop, colX.workDone - 5, tableBottom);
    doc.line(colX.spareUsed - 5, tableTop, colX.spareUsed - 5, tableBottom);
    doc.line(colX.remarks - 5, tableTop, colX.remarks - 5, tableBottom);
    doc.line(margin + pageWidth - margin * 2, tableTop, margin + pageWidth - margin * 2, tableBottom);

    // Footer section
    let yPos = tableBottom + 20;

    doc.setFont("helvetica", "bold");
    doc.text("Date Closed:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(record.dateOut ?? formatDate(new Date().toISOString()), margin + 30, yPos);

    yPos += 12;

    doc.setFont("helvetica", "bold");
    doc.text("Technician Signature:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`Signature: ________________________`, margin, yPos + 6);
    doc.text(`Name of Technician: ${technicianName || "-"}`, margin, yPos + 12);

    yPos += 22;

    doc.setFont("helvetica", "bold");
    doc.text("Section In-Charge Signature:", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`Signature: ________________________`, margin, yPos + 6);
    doc.text(`Name of Sec I/C: ${secIcName || "-"}`, margin, yPos + 12);

    // Computer Maintenance Officer at bottom-right
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Computer Maintenance Officer", pageWidth - margin - 50, pageHeight - 20, {
      align: "right",
    });

    // Save PDF
    const fileName = `Job Card - ${record.jobNo}.pdf`;
    doc.save(fileName);
  };

  const generateLogBookPDF = () => {
    if (!record) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    }) as any;

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    // Table header
    const colX: Record<string, number> = {
      sNo: margin,
      defect: margin + 15,
      workDone: margin + 55,
      spareUsed: margin + 110,
      remarks: margin + 145,
    };

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("S/No", colX.sNo, 20);
    doc.text("Defect", colX.defect, 20);
    doc.text("Work Done", colX.workDone, 20);
    doc.text("Spare Used", colX.spareUsed, 20);
    doc.text("Remarks", colX.remarks, 20);

    // Table row
    doc.setFont("helvetica", "normal");
    doc.text("1", colX.sNo, 30);
    doc.text(record.defect ?? "-", colX.defect, 30);
    doc.text(remarks || "-", colX.workDone, 30);
    doc.text("-", colX.spareUsed, 30);
    doc.text("S", colX.remarks, 30);

    // Draw table borders
    const tableTop = 15;
    const tableBottom = 35;
    doc.rect(margin, tableTop, pageWidth - margin * 2, tableBottom - tableTop);

    // Vertical lines
    doc.line(colX.defect - 5, tableTop, colX.defect - 5, tableBottom);
    doc.line(colX.workDone - 5, tableTop, colX.workDone - 5, tableBottom);
    doc.line(colX.spareUsed - 5, tableTop, colX.spareUsed - 5, tableBottom);
    doc.line(colX.remarks - 5, tableTop, colX.remarks - 5, tableBottom);
    doc.line(margin + pageWidth - margin * 2, tableTop, margin + pageWidth - margin * 2, tableBottom);

    const fileName = `Job Card Log - ${record.jobNo}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Out"
        description={`Issue stock for ${record.itemName}`}
        breadcrumb={[
          { label: "Stock In", href: "/stock-in" },
          { label: "Stock Out" },
        ]}
        actions={
          <>
            <Link href="/stock-in">
              <Button variant="outline">
                <ArrowLeft className="size-4 mr-2" /> Back to Stock In
              </Button>
            </Link>
            {submitted && (
              <>
                <Button
                  onClick={generateJobCardPDF}
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={submitting}
                >
                  <Download className="size-4 mr-2" /> Download Job Card
                </Button>
                <Button
                  onClick={generateLogBookPDF}
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={submitting}
                >
                  <FileText className="size-4 mr-2" /> Log book repairs
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Work Order Id</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-mono font-semibold">{record.workOrderId}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Job No</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-mono font-semibold">{record.jobNo}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Item</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">{record.itemName}</p>
            <p className="text-xs text-muted-foreground">
              Type {record.productType}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Quantity</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-2xl font-semibold tabular-nums">
              {formatNumber(record.quantity)}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Date In</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">{formatDate(record.dateIn)}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Department</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">{record.department}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Defect</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-semibold">
              {record.defect ?? "-"}
            </p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm font-semibold">Status</CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <span className="text-sm font-medium">
              {record.status === "Stock Out" ? "Stock Out" : "Pending"}
            </span>
          </CardContent>
        </Card>
      </div>

      {!submitted ? (
        <Card>
          <CardHeader>
            <CardTitle>Issue Stock</CardTitle>
            <CardDescription>
              Enter remarks and details for this stock-out. The date out will be
              recorded automatically on submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Remarks</Label>
                <Textarea
                  placeholder="Reason for issuing this stock…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Defect</Label>
                <Textarea
                  placeholder="Defect description…"
                  value={defect}
                  onChange={(e) => setDefect(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Technician Name</Label>
                <Input
                  placeholder="Technician name"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name of Sec I/c</Label>
                <Input
                  placeholder="Name of Section In-charge"
                  value={secIcName}
                  onChange={(e) => setSecIcName(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting || !remarks.trim() || !technicianName.trim() || !secIcName.trim() || !defect.trim()}
                className="bg-success hover:bg-success/90 text-white w-full"
              >
                {submitting ? (
                  <><PackageMinus className="size-4 mr-2" /> Issuing…</>
                ) : (
                  <><PackageMinus className="size-4 mr-2" /> Submit Stock Out</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Stock Out Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Work Order Id</Label>
                <p className="text-sm font-mono">{record.workOrderId}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Job No</Label>
                <p className="text-sm font-mono">{record.jobNo}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Item</Label>
                <p className="text-sm">{record.itemName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Quantity</Label>
                <p className="text-sm tabular-nums">{formatNumber(record.quantity)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date Out</Label>
                <p className="text-sm font-mono">{formatDate(new Date().toISOString())}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Technician Name</Label>
                <p className="text-sm">{technicianName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name of Sec I/c</Label>
                <p className="text-sm">{secIcName}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Defect</Label>
                <p className="text-sm">{record.defect ?? "-"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Resolve Remarks</Label>
                <p className="text-sm">{remarks}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Status</Label>
                <p className="text-sm font-semibold text-destructive">Stock Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
