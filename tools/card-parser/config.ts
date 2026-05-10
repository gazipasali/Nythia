import { CreditCard } from "lucide-react";
import type { ToolConfig } from "@/lib/tools-meta";

export const config: ToolConfig = {
  slug: "card-parser",
  name: "Card Parser",
  category: "Parsers",
  description:
    "Parse card strings in num|month|year|cvv format into a structured table. Supports bulk input, auto-detects delimiters and card brand.",
  icon: CreditCard,
};
