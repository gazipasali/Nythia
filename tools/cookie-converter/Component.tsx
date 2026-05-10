"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ClipboardCopy, ClipboardCheck, Eraser } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Format = "netscape" | "json" | "header";

interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "netscape", label: "Netscape (cookies.txt)" },
  { value: "json", label: "JSON (EditThisCookie)" },
  { value: "header", label: "Header string" },
];

const SAMPLE: Record<Format, string> = {
  netscape: `# Netscape HTTP Cookie File
.example.com	TRUE	/	TRUE	1800000000	session_id	abc123
.example.com	TRUE	/	FALSE	0	theme	dark`,
  json: `[
  {
    "name": "session_id",
    "value": "abc123",
    "domain": ".example.com",
    "path": "/",
    "expirationDate": 1800000000,
    "secure": true,
    "httpOnly": false,
    "sameSite": "lax"
  },
  {
    "name": "theme",
    "value": "dark",
    "domain": ".example.com",
    "path": "/",
    "secure": false,
    "httpOnly": false
  }
]`,
  header: "session_id=abc123; theme=dark",
};

function parseNetscape(input: string): ParsedCookie[] {
  const out: ParsedCookie[] = [];
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const stripped = line.replace(/^#HttpOnly_/i, "");
    const parts = stripped.split(/\t/);
    if (parts.length < 7) continue;
    const [domain, , path, secureFlag, expires, name, value] = parts;
    out.push({
      name,
      value,
      domain,
      path,
      expires: Number(expires) || undefined,
      secure: /^true$/i.test(secureFlag),
      httpOnly: /^#HttpOnly_/i.test(line),
    });
  }
  return out;
}

function parseJson(input: string): ParsedCookie[] {
  const data = JSON.parse(input);
  if (!Array.isArray(data)) {
    throw new Error("JSON must be an array of cookie objects");
  }
  return data.map((c: Record<string, unknown>): ParsedCookie => {
    if (!c.name || typeof c.name !== "string") {
      throw new Error("Each cookie must have a string `name`");
    }
    return {
      name: c.name,
      value: typeof c.value === "string" ? c.value : "",
      domain: typeof c.domain === "string" ? c.domain : undefined,
      path: typeof c.path === "string" ? c.path : undefined,
      expires:
        typeof c.expirationDate === "number"
          ? c.expirationDate
          : typeof c.expires === "number"
          ? c.expires
          : undefined,
      secure: typeof c.secure === "boolean" ? c.secure : undefined,
      httpOnly: typeof c.httpOnly === "boolean" ? c.httpOnly : undefined,
      sameSite: typeof c.sameSite === "string" ? c.sameSite : undefined,
    };
  });
}

function parseHeader(input: string): ParsedCookie[] {
  return input
    .split(/;\s*|\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return { name: pair, value: "" } as ParsedCookie;
      return {
        name: pair.slice(0, idx).trim(),
        value: pair.slice(idx + 1).trim(),
      };
    })
    .filter((c) => c.name);
}

function parse(input: string, format: Format): ParsedCookie[] {
  if (format === "netscape") return parseNetscape(input);
  if (format === "json") return parseJson(input);
  return parseHeader(input);
}

function emitNetscape(cookies: ParsedCookie[]): string {
  const lines: string[] = ["# Netscape HTTP Cookie File"];
  for (const c of cookies) {
    const domain = c.domain ?? "";
    const includeSubdomains = domain.startsWith(".") ? "TRUE" : "FALSE";
    const path = c.path ?? "/";
    const secure = c.secure ? "TRUE" : "FALSE";
    const expires = c.expires ?? 0;
    const prefix = c.httpOnly ? "#HttpOnly_" : "";
    lines.push(
      `${prefix}${domain}\t${includeSubdomains}\t${path}\t${secure}\t${expires}\t${c.name}\t${c.value}`,
    );
  }
  return lines.join("\n");
}

function emitJson(cookies: ParsedCookie[]): string {
  return JSON.stringify(
    cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path ?? "/",
      expirationDate: c.expires,
      secure: c.secure ?? false,
      httpOnly: c.httpOnly ?? false,
      sameSite: c.sameSite,
    })),
    null,
    2,
  );
}

function emitHeader(cookies: ParsedCookie[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function emit(cookies: ParsedCookie[], format: Format): string {
  if (format === "netscape") return emitNetscape(cookies);
  if (format === "json") return emitJson(cookies);
  return emitHeader(cookies);
}

export function Component() {
  const [from, setFrom] = useState<Format>("json");
  const [to, setTo] = useState<Format>("header");
  const [input, setInput] = useState<string>(SAMPLE.json);
  const [copied, setCopied] = useState(false);

  const { output, error, count } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null, count: 0 };
    try {
      const cookies = parse(input, from);
      return { output: emit(cookies, to), error: null, count: cookies.length };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to parse input";
      return { output: "", error: message, count: 0 };
    }
  }, [input, from, to]);

  function loadSample() {
    setInput(SAMPLE[from]);
  }

  async function copyOutput() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not access clipboard");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px] space-y-1">
          <Label htmlFor="from">From</Label>
          <select
            id="from"
            value={from}
            onChange={(e) => setFrom(e.target.value as Format)}
            className="h-10 w-full rounded-md border border-input bg-secondary/40 px-3 text-sm"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <ArrowRight className="mb-3 h-4 w-4 text-muted-foreground" />

        <div className="flex-1 min-w-[180px] space-y-1">
          <Label htmlFor="to">To</Label>
          <select
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value as Format)}
            className="h-10 w-full rounded-md border border-input bg-secondary/40 px-3 text-sm"
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" type="button" onClick={loadSample}>
            Load sample
          </Button>
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
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="input">Input</Label>
            <span className="text-xs text-muted-foreground">
              {count > 0 ? `${count} cookie${count > 1 ? "s" : ""}` : ""}
            </span>
          </div>
          <Textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="min-h-[320px]"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="output">Output</Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={copyOutput}
              disabled={!output}
            >
              {copied ? (
                <>
                  <ClipboardCheck className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <Textarea
            id="output"
            readOnly
            value={error ? `# Error\n${error}` : output}
            spellCheck={false}
            className="min-h-[320px]"
          />
        </div>
      </div>
    </div>
  );
}
