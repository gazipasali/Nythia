import type { LucideIcon } from "lucide-react";

export type ToolCategory = "Converters" | "Parsers" | "Generators" | "Other";

export interface ToolConfig {
  slug: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon: LucideIcon;
}

import { config as cookieConverter } from "@tools/cookie-converter/config";
import { config as cardParser } from "@tools/card-parser/config";

const configs: ToolConfig[] = [cookieConverter, cardParser];

export function getAllToolConfigs(): ToolConfig[] {
  return configs.slice();
}

export function getToolConfig(slug: string): ToolConfig | undefined {
  return configs.find((c) => c.slug === slug);
}

export function getAllToolSlugs(): string[] {
  return configs.map((c) => c.slug);
}
