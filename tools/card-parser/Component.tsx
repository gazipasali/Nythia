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

const CARD_NUMBER_RE = /(?:^|[^0-9])((?:\d[ \-]*){13,19})(?:[^0-9]|$)/;
const STANDALONE_CARD_RE = /^((?:\d[ \-]*){13,19})$/;
const DATE_RE = /^(0?[1-9]|1[0-2])\s*[\/\-\|]?\s*(20\d{2}|\d{2})$/;
const CVV_RE = /^\d{3,4}$/;
const MONTH_RE = /^(0?[1-9]|1[0-2])$/;
const YEAR_RE = /^(20\d{2}|\d{2})$/;

function hasCard(text: string): boolean {
  const CARD_PATTERNS = [
    /\b(\d{4}[\s\-]+\d{4}[\s\-]+\d{4}[\s\-]+\d{1,7})\b/,
    /\b(\d{4}[\s\-]+\d{6}[\s\-]+\d{4,5})\b/,
    /\b(\d{4}[\s\-]+\d{4}[\s\-]+\d{4}[\s\-]+\d{4}[\s\-]+\d{1,3})\b/,
    /\b(\d{13,19})\b/
  ];
  for (const pattern of CARD_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  return /\b((?:\d[\s\-]*){13,19})\b/.test(text);
}

function hasDate(text: string): boolean {
  return (
    /\b(0?[1-9]|1[0-2])\s*[\/\-\|]\s*(20\d{2}|\d{2})\b/.test(text) ||
    /\b(0[1-9]|1[0-2])(20\d{2}|\d{2})\b/.test(text) ||
    /\b(0?[1-9]|1[0-2])\s+(20\d{2}|\d{2})\b/.test(text)
  );
}

/**
 * Pre-process raw input into normalized single-line card entries.
 * Groups multi-line card data together automatically without getting confused by metadata.
 */
function normalizeInput(raw: string): string[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim());
  const normalized: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (hasCard(line)) {
      if (hasDate(line)) {
        // Complete single-line card
        normalized.push(line);
        i++;
      } else {
        // Card found, but no date. Collect following lines until next card.
        const parts: string[] = [line];
        let j = i + 1;
        while (j < lines.length) {
          const next = lines[j].trim();
          if (!next || next === "|") { j++; continue; }
          if (hasCard(next)) break; // Found next card, stop collecting
          parts.push(next);
          j++;
        }
        normalized.push(parts.join(" | "));
        i = j;
      }
    } else {
      i++;
    }
  }

  return normalized;
}

function parseLine(raw: string): ParsedCard | null {
  const line = raw.trim();
  if (!line) return null;

  // Find card number using structured patterns
  const CARD_PATTERNS = [
    /\b(\d{4}[\s\-]+\d{4}[\s\-]+\d{4}[\s\-]+\d{1,7})\b/,
    /\b(\d{4}[\s\-]+\d{6}[\s\-]+\d{4,5})\b/,
    /\b(\d{4}[\s\-]+\d{4}[\s\-]+\d{4}[\s\-]+\d{4}[\s\-]+\d{1,3})\b/,
    /\b(\d{13,19})\b/
  ];

  let rawCard = "";
  let cardNumber = "";

  for (const pattern of CARD_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const clean = match[1].replace(/\D/g, "");
      if (clean.length >= 13 && clean.length <= 19) {
        rawCard = match[1];
        cardNumber = clean;
        break;
      }
    }
  }

  // Fallback to aggressive regex
  if (!cardNumber) {
    const aggressiveMatch = line.match(/\b((?:\d[\s\-]*){13,19})\b/);
    if (aggressiveMatch) {
      const clean = aggressiveMatch[1].replace(/\D/g, "");
      if (clean.length >= 13 && clean.length <= 19) {
        rawCard = aggressiveMatch[1];
        cardNumber = clean;
      }
    }
  }

  if (!cardNumber) return null;

  // Mask the card number in the line
  let remaining = line.replace(rawCard, " ");

  let month = "";
  let year = "";
  let cvv = "";

  // 1. Try to find date
  const dateRegexWithDelim = /\b(0?[1-9]|1[0-2])\s*[\/\-\|]\s*(20\d{2}|\d{2})\b/;
  const dateRegexNoDelim = /\b(0[1-9]|1[0-2])(20\d{2}|\d{2})\b/;
  const dateRegexSpace = /\b(0?[1-9]|1[0-2])\s+(20\d{2}|\d{2})\b/;

  let dateEndIndex = -1;

  let dMatch = remaining.match(dateRegexWithDelim);
  if (dMatch) {
    month = dMatch[1].padStart(2, "0");
    year = dMatch[2];
    dateEndIndex = dMatch.index! + dMatch[0].length;
    remaining = remaining.replace(dMatch[0], " ");
  } else {
    dMatch = remaining.match(dateRegexNoDelim);
    if (dMatch) {
      month = dMatch[1];
      year = dMatch[2];
      dateEndIndex = dMatch.index! + dMatch[0].length;
      remaining = remaining.replace(dMatch[0], " ");
    } else {
      dMatch = remaining.match(dateRegexSpace);
      if (dMatch) {
        month = dMatch[1].padStart(2, "0");
        year = dMatch[2];
        dateEndIndex = dMatch.index! + dMatch[0].length;
        remaining = remaining.replace(dMatch[0], " ");
      }
    }
  }

  // 2. Try to find CVV
  const labeledCvv = remaining.match(/\b(?:cvv|cvc|ccv)[^\d]{0,3}(\d{3,4})\b/i);
  if (labeledCvv) {
    cvv = labeledCvv[1];
  } else {
    // Look after date first to avoid taking row numbers (like "1. ") as CVV
    const afterDate = dateEndIndex !== -1 ? remaining.slice(dateEndIndex) : remaining;
    const afterTokens = afterDate.split(/[\s\|\:\;\,\t]+/).filter(Boolean);
    const afterCvvTokens = afterTokens.filter((t) => /^\d{3,4}$/.test(t));
    
    if (afterCvvTokens.length > 0) {
      cvv = afterCvvTokens[0];
    } else {
      // Look anywhere, prefer last valid token
      const tokens = remaining.split(/[\s\|\:\;\,\t]+/).filter(Boolean);
      const cvvTokens = tokens.filter((t) => /^\d{3,4}$/.test(t));
      if (cvvTokens.length > 0) {
        cvv = cvvTokens[cvvTokens.length - 1];
      }
    }
  }

  if (!month || !year) return null;

  return {
    number: cardNumber,
    month,
    year: normalizeYear(year),
    cvv,
    brand: detectBrand(cardNumber),
    last4: cardNumber.slice(-4),
    valid: luhnCheck(cardNumber),
    raw: line,
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
