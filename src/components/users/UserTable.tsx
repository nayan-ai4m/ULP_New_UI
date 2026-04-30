import { Pencil, KeyRound, Power, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, UsersState } from "@/lib/mock/users";

/* ── Role badge colors ── */
const ROLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Operator:   { bg: "bg-primary/15",  text: "text-primary",  border: "border-primary/30" },
  Technician: { bg: "bg-warn-soft",   text: "text-warn",     border: "border-warn" },
  Manager:    { bg: "bg-good-soft",   text: "text-good",     border: "border-good" },
};

interface Props {
  state: UsersState;
  onEdit: (user: User) => void;
  onResetPw: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

export function UserTable({ state, onEdit, onResetPw, onToggleStatus }: Props) {
  const { pagedUsers, filteredUsers, page, setPage, totalPages } = state;

  return (
    <div className="panel overflow-hidden flex flex-col">
      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-border bg-[hsl(var(--surface-2))]/50">
              {["Username", "Display Name", "Role", "Last Login", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-foreground-dim font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {pagedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-[13px] text-foreground-dim"
                >
                  No users match your filters
                </td>
              </tr>
            ) : (
              pagedUsers.map((user) => <UserRow key={user.id} user={user} onEdit={onEdit} onResetPw={onResetPw} onToggleStatus={onToggleStatus} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Footer — counts + pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[hsl(var(--surface-1))]/60">
        <span className="text-[11px] text-foreground-dim">
          Showing {pagedUsers.length} of {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius)] text-[12px] border border-border transition-colors",
              page <= 1
                ? "text-foreground-dim cursor-not-allowed opacity-50"
                : "text-foreground-muted hover:text-foreground hover:bg-[hsl(var(--surface-2))]",
            )}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "h-8 w-8 rounded-[var(--radius)] text-[12px] font-medium border transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-foreground-muted border-border hover:text-foreground hover:bg-[hsl(var(--surface-2))]",
              )}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--radius)] text-[12px] border border-border transition-colors",
              page >= totalPages
                ? "text-foreground-dim cursor-not-allowed opacity-50"
                : "text-foreground-muted hover:text-foreground hover:bg-[hsl(var(--surface-2))]",
            )}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Single row ── */

function UserRow({
  user,
  onEdit,
  onResetPw,
  onToggleStatus,
}: {
  user: User;
  onEdit: (u: User) => void;
  onResetPw: (u: User) => void;
  onToggleStatus: (u: User) => void;
}) {
  const roleStyle = ROLE_STYLE[user.role] || ROLE_STYLE.Operator;
  const isActive = user.status === "Active";

  return (
    <tr className="group border-b border-border/50 last:border-b-0 hover:bg-[hsl(var(--surface-2))]/40 transition-colors">
      {/* Username */}
      <td className="px-4 py-3">
        <span className="font-mono text-[13px] font-semibold text-primary">
          {user.username}
        </span>
      </td>

      {/* Display Name */}
      <td className="px-4 py-3">
        <span className="text-[13px] text-foreground">{user.displayName}</span>
      </td>

      {/* Role Badge */}
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border",
            roleStyle.bg,
            roleStyle.text,
            roleStyle.border,
          )}
        >
          {user.role}
        </span>
      </td>

      {/* Last Login */}
      <td className="px-4 py-3">
        <span className="font-mono text-[12px] text-foreground-muted">
          {user.lastLogin || "—"}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "status-dot",
              isActive ? "bg-good animate-pulse-soft" : "bg-critical",
            )}
          />
          <span
            className={cn(
              "text-[12px] font-semibold",
              isActive ? "text-good" : "text-critical",
            )}
          >
            {user.status}
          </span>
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <ActionBtn
            icon={Pencil}
            label="Edit"
            onClick={() => onEdit(user)}
          />
          <ActionBtn
            icon={KeyRound}
            label="Reset PW"
            onClick={() => onResetPw(user)}
          />
          <ActionBtn
            icon={Power}
            label={isActive ? "Deactivate" : "Activate"}
            destructive={isActive}
            onClick={() => onToggleStatus(user)}
          />
        </div>
      </td>
    </tr>
  );
}

/* ── Action button ── */

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "group/btn inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[11px] font-medium",
        "border border-border transition-all",
        destructive
          ? "text-foreground-muted hover:text-critical hover:border-critical/40 hover:bg-critical/10"
          : "text-foreground-muted hover:text-foreground hover:border-primary/40 hover:bg-primary/10",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
