"use client";

const CODE_BLOCKS = [
  `import express from "express";
import { Pool } from "pg";
import cors from "cors";

const app = express();
app.use(cors());`,

  `const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: "reports",
  ssl: { rejectUnauthorized: false },
});`,

  `app.get("/api/reports", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM quarterly_reports"
  );
  res.json({ data: rows });
});`,

  `app.get("/api/clients", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, status FROM clients WHERE active = $1",
    [true]
  );
  res.json({ clients: rows });
});`,

  `app.post("/api/invoices", async (req, res) => {
  const { clientId, amount } = req.body;
  const result = await pool.query(
    "INSERT INTO invoices (client_id, amount) VALUES ($1, $2) RETURNING *",
    [clientId, amount]
  );
  res.status(201).json(result.rows[0]);
});`,

  `const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).end();
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch { res.status(403).end(); }
};`,

  `app.get("/api/metrics", authenticate, async (req, res) => {
  const stats = await pool.query(
    "SELECT date, revenue, expenses FROM metrics ORDER BY date DESC LIMIT 30"
  );
  res.json({ metrics: stats.rows });
});`,

  `const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});`,
];

const FULL_CODE = CODE_BLOCKS.join("\n\n");
const DOUBLED = FULL_CODE + "\n\n" + FULL_CODE + "\n\n" + FULL_CODE;

export function AuthCodeBackdrop({ badge }: { badge?: string }) {
  return (
    <div className="relative hidden h-full w-full select-none overflow-hidden rounded-l-xl border-r border-border/60 bg-card/40 md:flex md:flex-col">
      {badge ? (
        <div className="absolute left-4 top-3 z-10 flex items-center gap-2 text-[11px] font-medium text-emerald-400/90">
          <span aria-hidden>&#10003;</span>
          {badge}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <pre className="code-bg m-0 whitespace-pre p-6 opacity-60 animate-code-scroll">
          {DOUBLED}
        </pre>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/0 via-background/10 to-background/40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-card/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/80 to-transparent" />
    </div>
  );
}
