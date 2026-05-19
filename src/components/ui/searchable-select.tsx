"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string[];
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

export function SearchableSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  placeholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı.",
  className,
}: {
  id?: string;
  name: string;
  label: string;
  options: SearchableSelectOption[];
  defaultValue?: string;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const initialOption = options.find((option) => option.value === defaultValue) ?? options[0];
  const [query, setQuery] = useState(initialOption?.label ?? "");
  const [selectedValue, setSelectedValue] = useState(initialOption?.value ?? "");

  useEffect(() => {
    const selectedOption = options.find((option) => option.value === selectedValue);
    if (!selectedOption) return;
    setQuery(selectedOption.label);
  }, [options, selectedValue]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const haystacks = [option.label, ...(option.keywords ?? [])].map(normalizeText);
      return haystacks.some((value) => value.includes(normalizedQuery));
    });
  }, [options, query]);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <input type="hidden" name={name} value={selectedValue} />
      <Input
        id={inputId}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <div className="rounded-xl border border-border bg-white">
        {filteredOptions.length ? (
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.map((option) => {
              const active = option.value === selectedValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedValue(option.value);
                    setQuery(option.label);
                  }}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
