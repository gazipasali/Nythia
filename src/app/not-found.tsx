import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f8f9fa] text-center text-[#333]">
      <p className="text-xs uppercase tracking-[0.4em] text-[#aaa]">404</p>
      <h1 className="text-2xl font-semibold text-[#555]">Page not found</h1>
      <Link href="/" className="text-sm text-[#888] hover:text-[#555]">
        Go back to homepage
      </Link>
    </main>
  );
}
