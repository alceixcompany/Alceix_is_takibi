import { NextRequest, NextResponse } from "next/server";

import {
  filterDatasetForReports,
  getFirmStatusReportRows,
  getProductionReportRows,
  getReportSummary,
  getSalesPerformanceStats,
  getServiceReportRows,
} from "@/lib/analytics";
import { hasRole, requireUser } from "@/lib/auth";
import { loadCrmDataset } from "@/lib/repository";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";

function getFilters(request: NextRequest, isAdmin: boolean, userId: string) {
  const params = request.nextUrl.searchParams;

  return {
    dateFrom: params.get("from") ?? undefined,
    dateTo: params.get("to") ?? undefined,
    salesUserId: isAdmin ? params.get("salesUserId") ?? undefined : userId,
    serviceType: params.get("serviceType") ?? undefined,
    firmStatus: params.get("firmStatus") ?? undefined,
    paymentStatus: params.get("paymentStatus") ?? undefined,
  };
}

function xmlEscape(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function sheetXml(rows: Array<Array<string | number>>) {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => {
          const ref = `${columnName(cellIndex + 1)}${rowIndex + 1}`;
          const value = cell ?? "";
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${ref}"><v>${value}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>${body}</sheetData>
</worksheet>`;
}

function columnName(index: number) {
  let name = "";
  let current = index;
  while (current > 0) {
    const mod = (current - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    current = Math.floor((current - mod) / 26);
  }
  return name;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUInt16LE(value: number) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value, 0);
  return buffer;
}

function writeUInt32LE(value: number) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

function createZip(files: Array<{ name: string; content: string }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.content, "utf8");
    const crc = crc32(data);
    const localHeader = Buffer.concat([
      writeUInt32LE(0x04034b50),
      writeUInt16LE(20),
      writeUInt16LE(0x0800),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt32LE(crc),
      writeUInt32LE(data.length),
      writeUInt32LE(data.length),
      writeUInt16LE(name.length),
      writeUInt16LE(0),
      name,
    ]);

    localParts.push(localHeader, data);

    const centralHeader = Buffer.concat([
      writeUInt32LE(0x02014b50),
      writeUInt16LE(20),
      writeUInt16LE(20),
      writeUInt16LE(0x0800),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt32LE(crc),
      writeUInt32LE(data.length),
      writeUInt32LE(data.length),
      writeUInt16LE(name.length),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt16LE(0),
      writeUInt32LE(0),
      writeUInt32LE(offset),
      name,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.concat([
    writeUInt32LE(0x06054b50),
    writeUInt16LE(0),
    writeUInt16LE(0),
    writeUInt16LE(files.length),
    writeUInt16LE(files.length),
    writeUInt32LE(centralDirectory.length),
    writeUInt32LE(offset),
    writeUInt16LE(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function buildXlsx(sheets: Array<{ name: string; rows: Array<Array<string | number>> }>) {
  const workbookSheets = sheets
    .map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  const workbookRels = sheets
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");
  const overrides = sheets
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");

  return createZip([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}</Relationships>`,
    },
    ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml(sheet.rows) })),
  ]);
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildSimplePdf(lines: string[]) {
  const safeLines = lines.slice(0, 48).map((line) => escapePdfText(line.slice(0, 120)));
  const textCommands = ["BT", "/F1 10 Tf", "50 790 Td"];

  safeLines.forEach((line, index) => {
    if (index > 0) textCommands.push("0 -15 Td");
    textCommands.push(`(${line}) Tj`);
  });
  textCommands.push("ET");

  const stream = textCommands.join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const isAdmin = hasRole(user, "admin");
  const dataset = await loadCrmDataset(user);
  const filteredDataset = filterDatasetForReports(dataset, getFilters(request, isAdmin, user.id));
  const summary = getReportSummary(filteredDataset);
  const salesStats = getSalesPerformanceStats(filteredDataset);
  const serviceRows = getServiceReportRows(filteredDataset);
  const statusRows = getFirmStatusReportRows(filteredDataset);
  const productionRows = getProductionReportRows(filteredDataset);
  const format = request.nextUrl.searchParams.get("format") ?? "excel";
  const fileDate = new Date().toISOString().slice(0, 10);
  const userMap = new Map(dataset.users.map((item) => [item.id, item.name]));
  const firmMap = new Map(dataset.firms.map((item) => [item.id, item.company_name]));

  const summaryRows: Array<Array<string | number>> = [
    ["Alceix Panel Raporu", fileDate],
    ["Toplam müşteri", summary.totalCustomers],
    ["Aranan müşteri", summary.totalCalledCustomers],
    ["Ulaşılamayan", summary.totalUnreachable],
    ["İlgilenen", summary.totalInterested],
    ["Teklif verilen", summary.totalOffered],
    ["Ödeme bekleyen", summary.totalPaymentPending],
    ["Ödeme alınan", summary.totalPaymentReceived],
    ["Toplam ciro", summary.revenue],
    ["Toplam prim", summary.commission],
    ["Aktif üretim işi", summary.activeTasks],
    ["Geciken üretim işi", summary.overdueTasks],
    ["Tamamlanan iş", summary.completedTasks],
  ];

  const salesRows: Array<Array<string | number>> = [
    ["Satışçı", "Atanan", "Aranan", "Ulaşılamayan", "İlgilenen", "Teklif", "Ödeme bekleyen", "Ödeme alınan", "Ciro", "Prim", "Dönüşüm"],
    ...salesStats.map((row) => [
      row.user.name,
      row.assignedCustomers,
      row.totalCalledCustomers,
      row.unreachableCustomers,
      row.interestedCustomers,
      row.offeredCustomers,
      row.paymentPendingCustomers,
      row.paymentReceivedCustomers,
      row.revenue,
      row.commission,
      formatPercent(row.conversionRate),
    ]),
  ];

  const serviceReportRows: Array<Array<string | number>> = [
    ["Hizmet", "Satış", "Ciro", "Ortalama", "Bekleyen", "Alınan"],
    ...serviceRows.map((row) => [
      row.service.label,
      row.salesCount,
      row.revenue,
      row.averageSaleAmount,
      row.pendingAmount,
      row.paidAmount,
    ]),
  ];

  const statusReportRows: Array<Array<string | number>> = [
    ["Durum", "Adet", "Oran"],
    ...statusRows.map((row) => [row.status.label, row.count, formatPercent(row.ratio)]),
  ];

  const productionReportRows: Array<Array<string | number>> = [
    ["Çalışan", "Atanan", "Devam eden", "Revizyon", "Müşteri bekliyor", "Tamamlanan", "Geciken"],
    ...productionRows.map((row) => [
      row.user.name,
      row.assigned,
      row.inProgress,
      row.revision,
      row.waitingClient,
      row.done,
      row.overdue,
    ]),
  ];

  const callHistoryRows: Array<Array<string | number>> = [
    ["Tarih", "Satışçı", "Firma", "İşlem", "Not"],
    ...filteredDataset.activities
      .filter((activity) => ["call", "whatsapp", "sale", "payment", "status_change"].includes(activity.type))
      .map((activity) => [
        new Date(activity.created_at).toLocaleString("tr-TR"),
        activity.user_id ? userMap.get(activity.user_id) ?? "Bilinmiyor" : "Sistem",
        firmMap.get(activity.firm_id) ?? "Silinmiş firma",
        activity.type,
        activity.note ?? "",
      ]),
  ];

  const allRows = [
    ...summaryRows,
    [],
    ...salesRows,
    [],
    ...serviceReportRows,
    [],
    ...statusReportRows,
    [],
    ...productionReportRows,
    [],
    ...callHistoryRows,
  ];

  if (format === "pdf") {
    const pdf = buildSimplePdf(allRows.map((row) => row.filter(Boolean).join(" | ")));
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ajans-crm-rapor-${fileDate}.pdf"`,
      },
    });
  }

  if (format === "csv") {
    const csv = allRows.map((row) => row.map(csvCell).join(",")).join("\n");
    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ajans-crm-rapor-${fileDate}.csv"`,
      },
    });
  }

  const xlsx = buildXlsx([
    { name: "Özet", rows: summaryRows },
    { name: "Satışçılar", rows: salesRows },
    { name: "Hizmetler", rows: serviceReportRows },
    { name: "Durumlar", rows: statusReportRows },
    { name: "Üretim", rows: productionReportRows },
    { name: "Arama Geçmişi", rows: callHistoryRows },
  ]);

  return new NextResponse(new Uint8Array(xlsx), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ajans-crm-rapor-${fileDate}.xlsx"`,
    },
  });
}
