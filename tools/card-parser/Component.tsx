"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCopy,
  ClipboardCheck,
  Eraser,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ParsedCard {
  number: string;
  month: string;
  year: string;
  cvv: string;
  brand: string;
  last4: string;
  valid: boolean;
  raw: string;
}

const BRAND_COLORS: Record<string, string> = {
  Visa: "text-blue-400",
  Mastercard: "text-orange-400",
  Amex: "text-cyan-400",
  Discover: "text-amber-400",
  "Diners Club": "text-purple-400",
  JCB: "text-green-400",
  UnionPay: "text-red-400",
  Unknown: "text-muted-foreground",
};

function detectBrand(num: string): string {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  if (/^3(?:0[0-5]|[68])/.test(n)) return "Diners Club";
  if (/^35/.test(n)) return "JCB";
  if (/^62/.test(n)) return "UnionPay";
  return "Unknown";
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function normalizeYear(y: string): string {
  const cleaned = y.replace(/\D/g, "");
  if (cleaned.length === 4) return cleaned;
  if (cleaned.length === 2) {
    return `20${cleaned.padStart(2, "0")}`;
  }
  return cleaned;
}

const CARD_NUMBER_RE = /\b(\d{13,19})\b/;
const DATE_RE = /^\d{1,2}\/\d{2,4}$/;
const CVV_RE = /^\d{3,4}$/;
const STANDALONE_CARD_RE = /^\d{13,19}$/;
const MONTH_RE = /^\d{1,2}$/;
const YEAR_RE = /^\d{2,4}$/;

/**
 * Pre-process raw input into normalized single-line card entries.
 *
 * Supported formats:
 *  1) Single-line pipe:    4921307077061700|06/26|378
 *  2) Single-line pipe:    4921307077061700|06|26|378
 *  3) Single-line space:   4921307077061700 06/26 378
 *  4) Single-line mixed:   4921307077061700 06 26 378
 *  5) Multi-line with pipes on their own lines:
 *       4921307077061700
 *       |
 *       06/26
 *       |
 *       842
 *  6) Multi-line without explicit pipes:
 *       4921307077061700
 *       06/26
 *       842
 *  7) All of the above mixed with metadata lines (names, prices, etc.)
 */
function normalizeInput(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim());
  const normalized: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // --- Case A: line already contains a card number + delimiter(s) on one line ---
    if (line.match(CARD_NUMBER_RE) && !STANDALONE_CARD_RE.test(line)) {
      normalized.push(line);
      i++;
      continue;
    }

    // --- Case B: standalone card number, collect following lines ---
    if (STANDALONE_CARD_RE.test(line)) {
      const parts: string[] = [line];
      let j = i + 1;

      while (j < lines.length) {
        const next = lines[j].trim();

        // skip empty lines
        if (!next) { j++; continue; }

        // skip bare pipe delimiters
        if (next === "|") { j++; continue; }

        // if we hit another card number, stop
        if (STANDALONE_CARD_RE.test(next)) break;

        // date field  (06/26, 6/2026, 12/29, etc.)
        if (DATE_RE.test(next)) { parts.push(next); j++; continue; }

        // standalone month (01-12) — only accept if we don't have a date yet
        if (MONTH_RE.test(next) && parts.length === 1) {
          const monthNum = parseInt(next, 10);
          if (monthNum >= 1 && monthNum <= 12) { parts.push(next); j++; continue; }
        }

        // standalone year (2-4 digits) — only accept right after month
        if (YEAR_RE.test(next) && parts.length === 2 && MONTH_RE.test(parts[1])) {
          parts.push(next); j++; continue;
        }

        // CVV (3-4 digits) — accept if we already have date info
        if (CVV_RE.test(next) && parts.length >= 2) { parts.push(next); j++; continue; }

        // anything else is metadata — skip, but keep scanning for more fields
        // unless we already collected enough data
        if (parts.length >= 3) {
          j++;
          continue;
        }

        // unrecognised line and not enough data yet — stop
        break;
      }

      // Build the assembled string with pipes
      if (parts.length >= 2) {
        normalized.push(parts.join("|"));
      }
      i = j;
      continue;
    }

    // --- Case C: not a card-related line, skip ---
    i++;
  }

  return normalized;
}

function parseLine(raw: string): ParsedCard | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const numMatch = trimmed.match(CARD_NUMBER_RE);
  if (!numMatch) return null;

  const cardNumber = numMatch[1];
  const afterNumber = trimmed.slice(
    trimmed.indexOf(cardNumber) + cardNumber.length,
  );

  // Split remaining text by known delimiters
  const delimiters = ["|", ":", ";", "\t", ","];
  let fields: string[] = [];
  for (const d of delimiters) {
    if (afterNumber.includes(d)) {
      fields = afterNumber
        .split(d)
        .map((s) => s.trim())
        .filter(Boolean);
      break;
    }
  }

  // Fall back to space-splitting
  if (fields.length < 1) {
    const spaceFields = afterNumber.trim().split(/\s+/).filter(Boolean);
    if (spaceFields.length >= 1) fields = spaceFields;
  }

  if (fields.length < 1) return null;

  let month = "";
  let year = "";
  let cvvField = "";

  // --- Strategy 1: first field is combined date "MM/YY" or "MM/YYYY" ---
  if (DATE_RE.test(fields[0])) {
    const [m, y] = fields[0].split("/");
    month = m.padStart(2, "0");
    year = normalizeYear(y);
    cvvField = fields[1] ?? "";
  }
  // --- Strategy 2: separate month and year fields ---
  else if (fields.length >= 2) {
    const monthRaw = fields[0].replace(/\D/g, "");
    const yearRaw = fields[1].replace(/\D/g, "");
    if (!monthRaw || !yearRaw) return null;
    month = monthRaw.padStart(2, "0");
    year = normalizeYear(yearRaw);
    cvvField = fields[2] ?? "";
  } else {
    return null;
  }

  const monthNum = parseInt(month, 10);
  if (monthNum < 1 || monthNum > 12) return null;

  let cvv = cvvField ? cvvField.replace(/\D/g, "") : "";

  // If CVV doesn't look valid, try to extract 3-4 digit sequence from it
  if (cvv && (cvv.length < 3 || cvv.length > 4)) {
    const altCvv = cvvField.match(/\b(\d{3,4})\b/);
    cvv = altCvv ? altCvv[1] : "";
  }

  return {
    number: cardNumber,
    month,
    year,
    cvv,
    brand: detectBrand(cardNumber),
    last4: cardNumber.slice(-4),
    valid: luhnCheck(cardNumber),
    raw: trimmed,
  };
}

function formatCardNumber(num: string): string {
  const digits = num.replace(/\D/g, "");
  if (digits.length === 15) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10)}`;
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function ReadableCards({ cards }: { cards: ParsedCard[] }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function copyReadable(card: ParsedCard, idx: number) {
    const text = `${formatCardNumber(card.number)}  ${card.month}/${card.year}  CVV ${card.cvv}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast.success("Copied");
      setTimeout(() => setCopiedIdx(null), 1200);
    } catch {
      toast.error("Could not access clipboard");
    }
  }

  async function copyAllReadable() {
    const text = cards
      .map(
        (c, i) =>
          `${String(i + 1).padStart(2, " ")}. [${c.brand.padEnd(10)}]  ${formatCardNumber(c.number)}  ${c.month}/${c.year}  CVV ${c.cvv}  ${c.valid ? "✓" : "✗"}`,
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied all readable cards");
    } catch {
      toast.error("Could not access clipboard");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Readable Format</h3>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={copyAllReadable}
          disabled={cards.length === 0}
        >
          <ClipboardCopy className="h-4 w-4" />
          Copy all
        </Button>
      </div>
      <div className="space-y-2">
        {cards.map((c, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 rounded-lg border border-border/40 bg-card/40 px-5 py-4 transition-colors hover:bg-accent/30"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <CreditCard
                className={`h-4 w-4 ${BRAND_COLORS[c.brand] ?? ""}`}
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-mono text-base tracking-[0.15em]">
                {formatCardNumber(c.number)}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className={BRAND_COLORS[c.brand] ?? ""}>{c.brand}</span>
                <span>
                  EXP <span className="text-foreground">{c.month}/{c.year}</span>
                </span>
                {c.cvv ? (
                  <span>
                    CVV <span className="text-foreground">{c.cvv}</span>
                  </span>
                ) : null}
                {c.valid ? (
                  <span className="text-emerald-400">Luhn ✓</span>
                ) : (
                  <span className="text-rose-400">Luhn ✗</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyReadable(c, i)}
              className="shrink-0 rounded-md p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
              aria-label="Copy card"
            >
              {copiedIdx === i ? (
                <ClipboardCheck className="h-4 w-4" />
              ) : (
                <ClipboardCopy className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Component() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const cards = useMemo(() => {
    if (!input.trim()) return [];
    return normalizeInput(input)
      .map(parseLine)
      .filter((c): c is ParsedCard => c !== null);
  }, [input]);

  const validCount = cards.filter((c) => c.valid).length;
  const invalidCount = cards.filter((c) => !c.valid).length;

  async function copyAsJson() {
    if (cards.length === 0) return;
    const json = JSON.stringify(
      cards.map((c) => ({
        number: c.number,
        month: c.month,
        year: c.year,
        cvv: c.cvv,
        brand: c.brand,
        last4: c.last4,
        luhn: c.valid,
      })),
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success("Copied JSON to clipboard");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not access clipboard");
    }
  }

  async function copyFormatted() {
    if (cards.length === 0) return;
    const lines = cards.map(
      (c) => `${c.number}|${c.month}|${c.year}|${c.cvv}`,
    );
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Copied formatted cards to clipboard");
    } catch {
      toast.error("Could not access clipboard");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            type="button"
            onClick={() => setInput("")}
            aria-label="Clear input"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={copyFormatted}
            disabled={cards.length === 0}
          >
            <ClipboardCopy className="h-4 w-4" />
            Copy formatted
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={copyAsJson}
            disabled={cards.length === 0}
          >
            {copied ? (
              <ClipboardCheck className="h-4 w-4" />
            ) : (
              <ClipboardCopy className="h-4 w-4" />
            )}
            Copy JSON
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="card-input">
            Input — paste cards (one per line)
          </Label>
          <span className="text-xs text-muted-foreground">
            Auto-detects delimiters, ignores emojis and status text
          </span>
        </div>
        <Textarea
          id="card-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste cards here..."
          spellCheck={false}
          className="min-h-[200px]"
        />
      </div>

      {cards.length > 0 ? (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {cards.length} card{cards.length > 1 ? "s" : ""} parsed
              </span>
              <span className="text-emerald-400">{validCount} valid</span>
              {invalidCount > 0 ? (
                <span className="text-rose-400">{invalidCount} invalid</span>
              ) : null}
            </div>

            <div className="overflow-x-auto rounded-md border border-border/40">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border/40">
                    <th className="px-4 py-2.5 font-medium">#</th>
                    <th className="px-4 py-2.5 font-medium">Brand</th>
                    <th className="px-4 py-2.5 font-medium">Number</th>
                    <th className="px-4 py-2.5 font-medium">Exp</th>
                    <th className="px-4 py-2.5 font-medium">CVV</th>
                    <th className="px-4 py-2.5 font-medium">Last 4</th>
                    <th className="px-4 py-2.5 font-medium">Luhn</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-b-0 hover:bg-accent/30"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <CreditCard
                            className={`h-3.5 w-3.5 ${
                              BRAND_COLORS[c.brand] ?? ""
                            }`}
                          />
                          <span className={BRAND_COLORS[c.brand] ?? ""}>
                            {c.brand}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {c.number}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {c.month}/{c.year}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{c.cvv}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {c.last4}
                      </td>
                      <td className="px-4 py-2.5">
                        {c.valid ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                            PASS
                          </span>
                        ) : (
                          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-medium text-rose-400">
                            FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ReadableCards cards={cards} />
        </>
      ) : input.trim() ? (
        <div className="rounded-md border border-dashed border-border/60 px-5 py-8 text-center text-sm text-muted-foreground">
          No valid card lines detected. Format: <code>number|month|year|cvv</code>
        </div>
      ) : null}
    </div>
  );
}
