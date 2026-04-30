import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistorianState, Grade, SqiRecord, PqiRecord, TqiRecord } from "@/lib/mock/historian";
import { PAGE_SIZE } from "@/lib/mock/historian";

type Tab = "sqi" | "pqi" | "tqi";
interface Props { tab: Tab; state: HistorianState }

const GRADE_BADGE: Record<Grade, string> = {
  Green: "bg-[hsl(152_70%_48%/0.15)] text-good border-[hsl(152_70%_48%/0.3)]",
  Amber: "bg-[hsl(38_92%_55%/0.15)] text-warn border-[hsl(38_92%_55%/0.3)]",
  Red: "bg-[hsl(0_84%_62%/0.15)] text-critical border-[hsl(0_84%_62%/0.3)]",
};

const GRADE_BAR: Record<Grade, string> = {
  Green: "hsl(152 70% 48%)",
  Amber: "hsl(38 92% 55%)",
  Red: "hsl(0 84% 62%)",
};

const ROW_TINT: Record<Grade, string> = {
  Green: "",
  Amber: "bg-[hsl(38_92%_55%/0.03)]",
  Red: "bg-[hsl(0_84%_62%/0.05)] border-l-2 border-l-[hsl(0_84%_62%/0.4)]",
};

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", GRADE_BADGE[grade])}>
      {grade}
    </span>
  );
}

function ScoreCell({ score, grade }: { score: number; grade: Grade }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[13px] text-foreground">{score.toFixed(3)}</span>
      <div className="h-1.5 w-16 rounded-full bg-[hsl(var(--surface-3))] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 100}%`, background: GRADE_BAR[grade] }}
        />
      </div>
    </div>
  );
}

function DetailModal({ record, onClose }: { record: Record<string, unknown>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="panel-raised w-full max-w-md rounded-xl border border-border shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-foreground">Record Details · Cycle {record.cycle as number}</h3>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md border border-border text-foreground-dim hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(record).filter(([k]) => k !== "id").map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 p-2.5 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
              <span className="text-[9px] uppercase tracking-[0.14em] text-foreground-dim">{k}</span>
              <span className="font-mono text-[12px] text-foreground break-all">{String(v ?? "—")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, total, setPage }: { page: number; total: number; setPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = Math.min((page - 1) * PAGE_SIZE + 1, total);
  const to = Math.min(page * PAGE_SIZE, total);

  const pageNums: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) pageNums.push(i);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border">
      <span className="text-[12px] text-foreground-muted">
        Showing {total === 0 ? 0 : from}–{to} of {total} records
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className={cn(
            "px-3 py-1 rounded text-[12px] border transition-colors",
            page === 1 ? "border-border text-foreground-dim opacity-40 cursor-not-allowed" : "border-border text-foreground-muted hover:text-foreground",
          )}
        >
          ← Prev
        </button>
        {pageNums.map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={cn(
              "h-7 w-7 rounded text-[12px] font-medium transition-colors",
              n === page ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= pages}
          className={cn(
            "px-3 py-1 rounded text-[12px] border transition-colors",
            page >= pages ? "border-border text-foreground-dim opacity-40 cursor-not-allowed" : "border-border text-foreground-muted hover:text-foreground",
          )}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-foreground-dim font-semibold">
      {children}
    </th>
  );
}

export function HistoryTable({ tab, state }: Props) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);

  function fmtDate(ts: string) { return ts.slice(0, 10); }
  function fmtTime(ts: string) { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

  if (tab === "sqi") {
    const { sqiPage, sqiTotal, page, setPage } = state;
    return (
      <div className="panel overflow-hidden">
        <table className="w-full">
          <thead className="bg-[hsl(var(--surface-2))] border-b border-border">
            <tr><TH>Cycle</TH><TH>Date</TH><TH>Time</TH><TH>SQI Score</TH><TH>Grade</TH><TH>Failure Mode</TH><TH>Actions</TH></tr>
          </thead>
          <tbody>
            {sqiPage.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px] text-foreground-muted">No records match the current filters.</td></tr>
            ) : sqiPage.map((r: SqiRecord) => (
              <tr key={r.id} className={cn("border-b border-border/50 last:border-0", ROW_TINT[r.grade])}>
                <td className="px-4 py-3 font-mono text-[13px] text-foreground">{r.cycle}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">{fmtDate(r.ts)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">{fmtTime(r.ts)}</td>
                <td className="px-4 py-3"><ScoreCell score={r.score} grade={r.grade} /></td>
                <td className="px-4 py-3"><GradeBadge grade={r.grade} /></td>
                <td className="px-4 py-3 font-mono text-[12px] text-warn">{r.failureMode ?? <span className="text-foreground-dim">—</span>}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetail(r as unknown as Record<string, unknown>)} className="px-3 py-1 rounded-[var(--radius)] border border-border text-[12px] text-foreground-muted hover:text-foreground hover:border-primary/50 transition-colors">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={sqiTotal} setPage={setPage} />
        {detail && <DetailModal record={detail} onClose={() => setDetail(null)} />}
      </div>
    );
  }

  if (tab === "pqi") {
    const { pqiPage, pqiTotal, page, setPage } = state;
    return (
      <div className="panel overflow-hidden">
        <table className="w-full">
          <thead className="bg-[hsl(var(--surface-2))] border-b border-border">
            <tr><TH>Cycle</TH><TH>Date</TH><TH>Time</TH><TH>PQI Score</TH><TH>Grade</TH><TH>DEOC Grade</TH><TH>Actions</TH></tr>
          </thead>
          <tbody>
            {pqiPage.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-[13px] text-foreground-muted">No records match the current filters.</td></tr>
            ) : pqiPage.map((r: PqiRecord) => (
              <tr key={r.id} className={cn("border-b border-border/50 last:border-0", ROW_TINT[r.grade])}>
                <td className="px-4 py-3 font-mono text-[13px] text-foreground">{r.cycle}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">{fmtDate(r.ts)}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">{fmtTime(r.ts)}</td>
                <td className="px-4 py-3"><ScoreCell score={r.score} grade={r.grade} /></td>
                <td className="px-4 py-3"><GradeBadge grade={r.grade} /></td>
                <td className="px-4 py-3"><GradeBadge grade={r.deocGrade} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetail(r as unknown as Record<string, unknown>)} className="px-3 py-1 rounded-[var(--radius)] border border-border text-[12px] text-foreground-muted hover:text-foreground hover:border-primary/50 transition-colors">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={page} total={pqiTotal} setPage={setPage} />
        {detail && <DetailModal record={detail} onClose={() => setDetail(null)} />}
      </div>
    );
  }

  // TQI
  const { tqiPage, tqiTotal, page, setPage } = state;
  return (
    <div className="panel overflow-hidden">
      <table className="w-full">
        <thead className="bg-[hsl(var(--surface-2))] border-b border-border">
          <tr><TH>Cycle</TH><TH>Date</TH><TH>Time</TH><TH>TQI Score</TH><TH>Grade</TH><TH>Front Jaw Δ</TH><TH>Rear Jaw Δ</TH><TH>Actions</TH></tr>
        </thead>
        <tbody>
          {tqiPage.length === 0 ? (
            <tr><td colSpan={8} className="px-5 py-10 text-center text-[13px] text-foreground-muted">No records match the current filters.</td></tr>
          ) : tqiPage.map((r: TqiRecord) => (
            <tr key={r.id} className={cn("border-b border-border/50 last:border-0", ROW_TINT[r.grade])}>
              <td className="px-4 py-3 font-mono text-[13px] text-foreground">{r.cycle}</td>
              <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">{fmtDate(r.ts)}</td>
              <td className="px-4 py-3 font-mono text-[12px] text-foreground-muted">{fmtTime(r.ts)}</td>
              <td className="px-4 py-3"><ScoreCell score={r.score} grade={r.grade} /></td>
              <td className="px-4 py-3"><GradeBadge grade={r.grade} /></td>
              <td className={cn("px-4 py-3 font-mono text-[12px]", Math.abs(r.frontDelta) > 3 ? "text-warn" : "text-foreground")}>
                {r.frontDelta >= 0 ? "+" : ""}{r.frontDelta}°C
              </td>
              <td className={cn("px-4 py-3 font-mono text-[12px]", Math.abs(r.rearDelta) > 3 ? "text-warn" : "text-foreground")}>
                {r.rearDelta >= 0 ? "+" : ""}{r.rearDelta}°C
              </td>
              <td className="px-4 py-3">
                <button onClick={() => setDetail(r as unknown as Record<string, unknown>)} className="px-3 py-1 rounded-[var(--radius)] border border-border text-[12px] text-foreground-muted hover:text-foreground hover:border-primary/50 transition-colors">
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} total={tqiTotal} setPage={setPage} />
      {detail && <DetailModal record={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
