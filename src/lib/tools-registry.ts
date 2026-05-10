import type { ComponentType } from "react";

import {
  getAllToolSlugs,
  getToolConfig,
  type ToolConfig,
} from "@/lib/tools-meta";

import { Component as CookieConverterComponent } from "@tools/cookie-converter/Component";
import { Component as CardParserComponent } from "@tools/card-parser/Component";

const components: Record<string, ComponentType> = {
  "cookie-converter": CookieConverterComponent,
  "card-parser": CardParserComponent,
};

export interface ToolEntry {
  config: ToolConfig;
  component: ComponentType;
}

export { getAllToolSlugs };

export function getToolBySlug(slug: string): ToolEntry | undefined {
  const config = getToolConfig(slug);
  const component = components[slug];
  if (!config || !component) return undefined;
  return { config, component };
}
