import { Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UsersState, RoleFilter } from "@/lib/mock/users";

const ROLE_FILTERS: { id: RoleFilter; label: string }[] = [
  { id: "All",        label: "All Roles" },
  { id: "Operator",   label: "Operator" },
  { id: "Technician", label: "Technician" },
  { id: "Manager",    label: "Manager" },
];

interface Props {
  state: UsersState;
  onAddUser: () => void;
}

export function UserToolbar({ state, onAddUser }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-dim" />
        <input
          type="text"
          value={state.searchQuery}
          onChange={(e) => {
            state.setSearchQuery(e.target.value);
            state.setPage(1);
          }}
          placeholder="Search users…"
          className="w-full pl-9 pr-3 py-2 bg-[hsl(var(--surface-2))] border border-border text-sm text-foreground
                     rounded-[var(--radius)] placeholder:text-foreground-dim
                     focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
        />
      </div>

      {/* Role filter buttons */}
      <div className="flex items-center gap-1">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => {
              state.setRoleFilter(f.id);
              state.setPage(1);
            }}
            className={cn(
              "px-3 py-1.5 rounded-[var(--radius)] text-[12px] font-medium border transition-colors whitespace-nowrap",
              state.roleFilter === f.id
                ? "bg-primary/15 text-primary border-primary/40"
                : "text-foreground-muted border-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Add User */}
      <button
        onClick={onAddUser}
        className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground
                   text-[13px] font-semibold hover:opacity-90 transition-opacity"
      >
        <UserPlus className="h-4 w-4" />
        Add User
      </button>
    </div>
  );
}
