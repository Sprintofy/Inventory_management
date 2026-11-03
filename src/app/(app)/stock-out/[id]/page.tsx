"use client";

import * as React from "react";
import Link from "next/link";
import {
  PackageMinus,
  ArrowLeft,
  Clock,
  User,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatNumber } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";
import jsPDF from "jspdf";

export default function StockOutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: recordId } = React.use(params);

  const { state, stockOut } = useApp();

  const record = state.stockInRecords.find((r) => String(r.id) === recordId);

  const [remarks, setRemarks] = React.useState(record?.remarks ?? "");
  const [technicianName, setTechnicianName] = React.useState(
    record?.technicianName ?? "",
  );
  const [secIcName, setSecIcName] = React.useState(record?.secIcName ?? "");
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
      await stockOut(
        recordId,
        remarks.trim(),
        technicianName.trim(),
        secIcName.trim(),
      );
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // ===== Title =====
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("JOB CARD", pageWidth / 2, 25, { align: "center" });

    // ===== Job Card No & Date =====
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Job Card No:", margin, 40);
    doc.setFont("helvetica", "normal");
    doc.text(record.workOrderId || "-", margin + 25, 40);
    doc.line(margin + 25, 41, margin + 85, 41);

    doc.setFont("helvetica", "bold");
    doc.text("Date:", pageWidth - margin - 60, 40);
    doc.setFont("helvetica", "normal");
    doc.text(
      record.dateIn || formatDate(new Date().toISOString()),
      pageWidth - margin - 45,
      40,
    );
    doc.line(pageWidth - margin - 45, 41, pageWidth - margin, 41);

    // ===== Table =====
    const tableTop = 55;
    const headerHeight = 10;
    const rowHeight = 10;
    const dataRows = 12;
    const tableHeight = headerHeight + rowHeight * dataRows;
    const tableBottom = tableTop + tableHeight;

    const colWidths = {
      sNo: 18,
      defect: 45,
      workDone: 50,
      spareUsed: 35,
      remarks: 32,
    };

    const colX = {
      sNo: margin,
      defect: margin + colWidths.sNo,
      workDone: margin + colWidths.sNo + colWidths.defect,
      spareUsed: margin + colWidths.sNo + colWidths.defect + colWidths.workDone,
      remarks:
        margin +
        colWidths.sNo +
        colWidths.defect +
        colWidths.workDone +
        colWidths.spareUsed,
      end: margin + contentWidth,
    };

    // Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headerY = tableTop + 7;
    doc.text("S/No", colX.sNo + colWidths.sNo / 2, headerY, {
      align: "center",
    });
    doc.text("Defect", colX.defect + colWidths.defect / 2, headerY, {
      align: "center",
    });
    doc.text("Work Done", colX.workDone + colWidths.workDone / 2, headerY, {
      align: "center",
    });
    doc.text("Spare Used", colX.spareUsed + colWidths.spareUsed / 2, headerY, {
      align: "center",
    });
    doc.text("Remarks", colX.remarks + colWidths.remarks / 2, headerY, {
      align: "center",
    });

    // First data row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const padX = 2;
    const firstRowY = tableTop + headerHeight + 6;
    const wrapText = (text: string, maxW: number) =>
      doc.splitTextToSize(text || "-", maxW - 4);

    doc.text("1", colX.sNo + colWidths.sNo / 2, firstRowY, {
      align: "center",
    });
    doc.text(
      wrapText(record.defect ?? "-", colWidths.defect),
      colX.defect + padX,
      firstRowY,
    );
    doc.text(
      wrapText(remarks || "-", colWidths.workDone),
      colX.workDone + padX,
      firstRowY,
    );
    doc.text("-", colX.spareUsed + colWidths.spareUsed / 2, firstRowY, {
      align: "center",
    });
    doc.text("S", colX.remarks + colWidths.remarks / 2, firstRowY, {
      align: "center",
    });

    // Table borders
    doc.rect(margin, tableTop, contentWidth, tableHeight);
    doc.line(
      margin,
      tableTop + headerHeight,
      colX.end,
      tableTop + headerHeight,
    );
    doc.line(colX.defect, tableTop, colX.defect, tableBottom);
    doc.line(colX.workDone, tableTop, colX.workDone, tableBottom);
    doc.line(colX.spareUsed, tableTop, colX.spareUsed, tableBottom);
    doc.line(colX.remarks, tableTop, colX.remarks, tableBottom);
    for (let i = 1; i < dataRows; i++) {
      const y = tableTop + headerHeight + rowHeight * i;
      doc.line(margin, y, colX.end, y);
    }

    // ===== Date Closed =====
    let yPos = tableBottom + 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Date Closed:", pageWidth - margin - 60, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(
      record.dateOut ?? formatDate(new Date().toISOString()),
      pageWidth - margin - 35,
      yPos,
    );
    doc.line(pageWidth - margin - 35, yPos + 1, pageWidth - margin, yPos + 1);

    // ===== Signatures =====
    yPos += 25;
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Signature:", leftColX, yPos);
    doc.text("Signature:", rightColX, yPos);
    doc.line(leftColX + 22, yPos + 1, leftColX + 75, yPos + 1);
    doc.line(rightColX + 22, yPos + 1, rightColX + 75, yPos + 1);

    yPos += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Name of Technician:", leftColX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(technicianName || "-", leftColX + 42, yPos);
    doc.line(leftColX + 42, yPos + 1, leftColX + 85, yPos + 1);

    doc.setFont("helvetica", "bold");
    doc.text("Name of Sec I/C:", rightColX, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(secIcName || "-", rightColX + 35, yPos);
    doc.line(rightColX + 35, yPos + 1, rightColX + 78, yPos + 1);

    // ===== Computer Maintenance Officer =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      "Computer Maintenance Officer",
      pageWidth - margin,
      pageHeight - 25,
      {
        align: "right",
      },
    );

    doc.save(`Job Card - ${record.jobNo}.pdf`);
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
    const contentWidth = pageWidth - margin * 2;

    const tableTop = 15;
    const headerHeight = 10;
    const rowHeight = 10;
    const dataRows = 12;
    const tableHeight = headerHeight + rowHeight * dataRows;
    const tableBottom = tableTop + tableHeight;

    const colWidths = {
      sNo: 18,
      defect: 45,
      workDone: 50,
      spareUsed: 35,
      remarks: 32,
    };

    const colX = {
      sNo: margin,
      defect: margin + colWidths.sNo,
      workDone: margin + colWidths.sNo + colWidths.defect,
      spareUsed: margin + colWidths.sNo + colWidths.defect + colWidths.workDone,
      remarks:
        margin +
        colWidths.sNo +
        colWidths.defect +
        colWidths.workDone +
        colWidths.spareUsed,
      end: margin + contentWidth,
    };

    // Header
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headerY = tableTop + 7;
    doc.text("S/No", colX.sNo + colWidths.sNo / 2, headerY, {
      align: "center",
    });
    doc.text("Defect", colX.defect + colWidths.defect / 2, headerY, {
      align: "center",
    });
    doc.text("Work Done", colX.workDone + colWidths.workDone / 2, headerY, {
      align: "center",
    });
    doc.text("Spare Used", colX.spareUsed + colWidths.spareUsed / 2, headerY, {
      align: "center",
    });
    doc.text("Remarks", colX.remarks + colWidths.remarks / 2, headerY, {
      align: "center",
    });

    // First data row
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const padX = 2;
    const firstRowY = tableTop + headerHeight + 6;
    const wrapText = (text: string, maxW: number) =>
      doc.splitTextToSize(text || "-", maxW - 4);

    doc.text("1", colX.sNo + colWidths.sNo / 2, firstRowY, {
      align: "center",
    });
    doc.text(
      wrapText(record.defect ?? "-", colWidths.defect),
      colX.defect + padX,
      firstRowY,
    );
    doc.text(
      wrapText(remarks || "-", colWidths.workDone),
      colX.workDone + padX,
      firstRowY,
    );
    doc.text("-", colX.spareUsed + colWidths.spareUsed / 2, firstRowY, {
      align: "center",
    });
    doc.text("S", colX.remarks + colWidths.remarks / 2, firstRowY, {
      align: "center",
    });

    // Table borders
    doc.rect(margin, tableTop, contentWidth, tableHeight);
    doc.line(
      margin,
      tableTop + headerHeight,
      colX.end,
      tableTop + headerHeight,
    );
    doc.line(colX.defect, tableTop, colX.defect, tableBottom);
    doc.line(colX.workDone, tableTop, colX.workDone, tableBottom);
    doc.line(colX.spareUsed, tableTop, colX.spareUsed, tableBottom);
    doc.line(colX.remarks, tableTop, colX.remarks, tableBottom);
    for (let i = 1; i < dataRows; i++) {
      const y = tableTop + headerHeight + rowHeight * i;
      doc.line(margin, y, colX.end, y);
    }

    doc.save(`Log Book Repairs - ${record.jobNo}.pdf`);
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
            <CardTitle className="text-sm font-semibold">
              Work Order Id
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5">
            <p className="text-lg font-mono font-semibold">
              {record.workOrderId}
            </p>
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
            <p className="text-lg font-semibold">{record.defect ?? "-"}</p>
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
                disabled={
                  submitting ||
                  !remarks.trim() ||
                  !technicianName.trim() ||
                  !secIcName.trim()
                }
                className="bg-success hover:bg-success/90 text-white w-full"
              >
                {submitting ? (
                  <>
                    <PackageMinus className="size-4 mr-2" /> Issuing…
                  </>
                ) : (
                  <>
                    <PackageMinus className="size-4 mr-2" /> Submit Stock Out
                  </>
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
                <p className="text-sm tabular-nums">
                  {formatNumber(record.quantity)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Date Out</Label>
                <p className="text-sm font-mono">
                  {formatDate(new Date().toISOString())}
                </p>
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
                <p className="text-sm font-semibold text-destructive">
                  Stock Out
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
function wrapText(arg0: string, defect: number): any {
  throw new Error("Function not implemented.");
}
