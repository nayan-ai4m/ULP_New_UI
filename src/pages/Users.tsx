import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLiveDashboard } from "@/lib/mock/dashboard";
import { useUsersState } from "@/lib/mock/users";
import { TopBar } from "@/components/cockpit/TopBar";
import { UserSummaryStrip } from "@/components/users/UserSummaryStrip";
import { UserToolbar } from "@/components/users/UserToolbar";
import { UserTable } from "@/components/users/UserTable";
import { ActivityLog } from "@/components/users/ActivityLog";
import {
  AddUserDialog,
  EditUserDialog,
  ResetPasswordDialog,
  ToggleStatusDialog,
} from "@/components/users/UserDialogs";
import type { User } from "@/lib/mock/users";

type Tab = "directory" | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "directory", label: "User Directory" },
  { id: "activity",  label: "Activity Log" },
];

const Users = () => {
  const dash = useLiveDashboard();
  const state = useUsersState();
  const [tab, setTab] = useState<Tab>("directory");

  /* Dialog state */
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPwUser, setResetPwUser] = useState<User | null>(null);
  const [toggleUser, setToggleUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar machine={dash.machine} />

      {/* Sub-tab bar */}
      <div className="border-b border-border bg-[hsl(var(--surface-1))]/60 px-5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm transition-colors whitespace-nowrap",
                active ? "text-foreground" : "text-foreground-muted hover:text-foreground",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">
        {tab === "directory" && (
          <>
            <UserSummaryStrip state={state} />
            <UserToolbar state={state} onAddUser={() => setAddOpen(true)} />
            <UserTable
              state={state}
              onEdit={setEditUser}
              onResetPw={setResetPwUser}
              onToggleStatus={setToggleUser}
            />
          </>
        )}
        {tab === "activity" && <ActivityLog state={state} />}
      </main>

      <footer className="border-t border-border px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] text-foreground-dim">
          Dark Cascade Framework · AI4M-FRS-2604-001 · Edge AI Gateway
        </span>
        <span className="font-mono text-[11px] text-foreground-dim">
          PostgreSQL user_roles · RBAC · Row-Level Security · JWT Auth
        </span>
      </footer>

      {/* Dialogs */}
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => state.addUser({ username: data.username, displayName: data.displayName, role: data.role })}
      />
      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSubmit={(id, data) => state.updateUser(id, data)}
      />
      <ResetPasswordDialog
        user={resetPwUser}
        onClose={() => setResetPwUser(null)}
        onConfirm={(id) => state.resetPassword(id)}
      />
      <ToggleStatusDialog
        user={toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={(id) => state.toggleStatus(id)}
      />
    </div>
  );
};

export default Users;
