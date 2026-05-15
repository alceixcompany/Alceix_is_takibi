"use client";

import Papa from "papaparse";
import { useActionState, useState } from "react";

import { FormMessage } from "@/components/ui/form-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { importFirmsAction } from "@/lib/actions/firms";

interface CsvFirmRow {
  company_name: string;
  sector?: string | null;
  city?: string | null;
  district?: string | null;
  phone?: string | null;
  instagram?: string | null;
  website?: string | null;
  has_website?: boolean;
  source?: string | null;
  assigned_to?: string | null;
  status?: string | null;
  note?: string | null;
  next_follow_up_at?: string | null;
}

function normalizeRow(row: Record<string, string>): CsvFirmRow {
  const hasWebsiteRaw = row.has_website?.trim().toLowerCase();

  return {
    company_name: row.company_name?.trim() ?? "",
    sector: row.sector?.trim() || null,
    city: row.city?.trim() || null,
    district: row.district?.trim() || null,
    phone: row.phone?.trim() || null,
    instagram: row.instagram?.trim() || null,
    website: row.website?.trim() || null,
    has_website: ["1", "true", "evet", "yes"].includes(hasWebsiteRaw || ""),
    source: row.source?.trim() || "csv-import",
    assigned_to: row.assigned_to?.trim() || null,
    status: row.status?.trim() || null,
    note: row.note?.trim() || null,
    next_follow_up_at: row.next_follow_up_at?.trim() || null,
  };
}

export function ImportCsvCard() {
  const [rows, setRows] = useState<CsvFirmRow[]>([]);
  const [parseError, setParseError] = useState<string>("");
  const [state, action] = useActionState(importFirmsAction, {});

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Beklenen kolonlar: `company_name`, `sector`, `city`, `district`, `phone`, `instagram`,
        `website`, `has_website`, `source`, `assigned_to`, `status`, `note`, `next_follow_up_at`
      </div>

      <form action={action} className="space-y-4">
        <input
          type="file"
          accept=".csv"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            Papa.parse<Record<string, string>>(file, {
              header: true,
              skipEmptyLines: true,
              complete: (result) => {
                const parsedRows = result.data
                  .map(normalizeRow)
                  .filter((row) => row.company_name.length > 0);

                if (!parsedRows.length) {
                  setParseError("CSV içinde geçerli satır bulunamadı.");
                  setRows([]);
                  return;
                }

                setRows(parsedRows);
                setParseError("");
              },
              error: (error) => {
                setParseError(error.message);
                setRows([]);
              },
            });
          }}
          className="block w-full rounded-xl border border-border bg-white px-3 py-3 text-sm text-foreground"
        />

        <input type="hidden" name="rows" value={JSON.stringify(rows)} />

        <FormMessage error={parseError || state.error} success={state.success} />

        {rows.length > 0 ? (
          <div className="rounded-2xl border border-border bg-white p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              Önizleme: {rows.length} satır hazır
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {rows.slice(0, 5).map((row) => (
                <div key={`${row.company_name}-${row.phone}`} className="rounded-xl bg-muted/50 px-3 py-2">
                  {row.company_name} - {row.city ?? "Şehir yok"} - {row.phone ?? "Telefon yok"}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <SubmitButton disabled={!rows.length}>CSV Satırlarını İçe Aktar</SubmitButton>
      </form>
    </div>
  );
}
