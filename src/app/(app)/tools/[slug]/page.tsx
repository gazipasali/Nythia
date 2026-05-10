import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllToolSlugs, getToolBySlug } from "@/lib/tools-registry";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllToolSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const tool = getToolBySlug(params.slug);
  if (!tool) return { title: "Tool not found · Nythia" };
  return { title: `${tool.config.name} · Nythia` };
}

export default function ToolPage({ params }: PageProps) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  const { config, component: Component } = tool;
  const Icon = config.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold">{config.name}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </header>

      <Card>
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {config.category}
          </CardTitle>
          <CardDescription className="sr-only">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <Component />
        </CardContent>
      </Card>
    </div>
  );
}
