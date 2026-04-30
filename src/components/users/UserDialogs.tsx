import { useState } from "react";
import { X, Eye, EyeOff, AlertTriangle, UserPlus, Pencil, KeyRound, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/lib/mock/users";

/* ────────────── Shared overlay backdrop ────────────── */

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function DialogShell({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  icon: typeof UserPlus;
  iconColor: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="relative w-full max-w-lg mx-4 panel-raised p-0 overflow-hidden animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6 pb-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-[12px] text-foreground-dim mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-dim hover:text-foreground hover:bg-[hsl(var(--surface-3))] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

/* ────────── Label + Input helpers ────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] uppercase tracking-[0.12em] text-foreground-dim font-medium">
      {children}
    </label>
  );
}

function TextInput({
  value, onChange, placeholder, autoFocus,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full bg-[hsl(var(--surface-2))] border border-border text-foreground text-[13px] rounded-[var(--radius)]
                 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-foreground-dim"
    />
  );
}

function PasswordInput({
  value, onChange, placeholder,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[hsl(var(--surface-2))] border border-border text-foreground text-[13px] rounded-[var(--radius)]
                   px-3 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-primary transition-shadow placeholder:text-foreground-dim"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-dim hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const ROLES: UserRole[] = ["Operator", "Technician", "Manager"];

function RoleSelector({ value, onChange }: { value: UserRole; onChange: (r: UserRole) => void }) {
  return (
    <div className="flex items-center gap-1">
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "flex-1 px-3 py-2 rounded-[var(--radius)] text-[12px] font-medium border transition-colors text-center",
            value === r
              ? "bg-primary/15 text-primary border-primary/40"
              : "text-foreground-muted border-border hover:text-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-border">{children}</div>;
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-[var(--radius)] text-[13px] font-medium text-foreground-muted
                 border border-border hover:text-foreground hover:bg-[hsl(var(--surface-3))] transition-colors"
    >
      Cancel
    </button>
  );
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-5 py-2 rounded-[var(--radius)] text-[13px] font-semibold transition-opacity",
        "bg-primary text-primary-foreground",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
      )}
    >
      {children}
    </button>
  );
}

function DestructiveBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-[var(--radius)] text-[13px] font-semibold bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90 transition-opacity"
    >
      {children}
    </button>
  );
}

function GoodBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-[var(--radius)] text-[13px] font-semibold bg-[hsl(var(--status-good))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity"
    >
      {children}
    </button>
  );
}

/* ══════════════ ADD USER DIALOG ══════════════ */

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { username: string; displayName: string; role: UserRole; password: string }) => void;
}

export function AddUserDialog({ open, onClose, onSubmit }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>("Operator");
  const [password, setPassword] = useState("");

  if (!open) return null;

  const valid = username.trim().length >= 2 && displayName.trim().length >= 1 && password.length >= 4;

  function handleSubmit() {
    if (!valid) return;
    onSubmit({ username: username.trim(), displayName: displayName.trim(), role, password });
    setUsername(""); setDisplayName(""); setRole("Operator"); setPassword("");
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <DialogShell
        title="Add New User"
        subtitle="Create a new user account. The user will be active immediately."
        icon={UserPlus}
        iconColor="bg-primary/15 text-primary border-primary/30"
        onClose={onClose}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Username</FieldLabel>
            <TextInput value={username} onChange={setUsername} placeholder="e.g. john_doe" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Display Name</FieldLabel>
            <TextInput value={displayName} onChange={setDisplayName} placeholder="e.g. John Doe" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Role</FieldLabel>
            <RoleSelector value={role} onChange={setRole} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Initial Password</FieldLabel>
            <PasswordInput value={password} onChange={setPassword} placeholder="Minimum 4 characters" />
          </div>

          <ActionRow>
            <CancelBtn onClick={onClose} />
            <PrimaryBtn onClick={handleSubmit} disabled={!valid}>
              Add User
            </PrimaryBtn>
          </ActionRow>
        </div>
      </DialogShell>
    </Overlay>
  );
}

/* ══════════════ EDIT USER DIALOG ══════════════ */

interface EditUserDialogProps {
  user: User | null;
  onClose: () => void;
  onSubmit: (id: string, data: { displayName: string; role: UserRole }) => void;
}

export function EditUserDialog({ user, onClose, onSubmit }: EditUserDialogProps) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "Operator");

  // sync when user changes
  if (user && displayName === "" && role === "Operator" && user.displayName !== "") {
    setDisplayName(user.displayName);
    setRole(user.role);
  }

  if (!user) return null;

  function handleSubmit() {
    if (!user) return;
    onSubmit(user.id, { displayName: displayName.trim(), role });
    onClose();
  }

  return (
    <Overlay onClose={onClose}>
      <DialogShell
        title={`Edit User — ${user.username}`}
        subtitle="Update the display name or role for this user."
        icon={Pencil}
        iconColor="bg-primary/15 text-primary border-primary/30"
        onClose={onClose}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Username</FieldLabel>
            <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--surface-3))] border border-border rounded-[var(--radius)]">
              <span className="font-mono text-[13px] text-foreground-dim">{user.username}</span>
              <span className="text-[10px] text-foreground-dim ml-auto">Read-only</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Display Name</FieldLabel>
            <TextInput value={displayName} onChange={setDisplayName} autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Role</FieldLabel>
            <RoleSelector value={role} onChange={setRole} />
          </div>

          <ActionRow>
            <CancelBtn onClick={onClose} />
            <PrimaryBtn onClick={handleSubmit} disabled={displayName.trim().length < 1}>
              Save Changes
            </PrimaryBtn>
          </ActionRow>
        </div>
      </DialogShell>
    </Overlay>
  );
}

/* ══════════════ RESET PASSWORD DIALOG ══════════════ */

interface ResetPwDialogProps {
  user: User | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function ResetPasswordDialog({ user, onClose, onConfirm }: ResetPwDialogProps) {
  if (!user) return null;
  return (
    <Overlay onClose={onClose}>
      <DialogShell
        title="Reset Password"
        subtitle={`Reset the password for "${user.username}".`}
        icon={KeyRound}
        iconColor="bg-warn-soft text-warn border-warn"
        onClose={onClose}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-3 rounded-[var(--radius)] bg-warn-soft border border-warn">
            <AlertTriangle className="h-5 w-5 text-warn shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-warn">Warning</span>
              <span className="text-[12px] text-foreground-muted">
                This will reset the password for <strong className="text-foreground">{user.displayName}</strong> ({user.username}).
                The user will need to set a new password on next login. This action is logged in the audit trail.
              </span>
            </div>
          </div>

          <ActionRow>
            <CancelBtn onClick={onClose} />
            <PrimaryBtn onClick={() => { onConfirm(user.id); onClose(); }}>
              Reset Password
            </PrimaryBtn>
          </ActionRow>
        </div>
      </DialogShell>
    </Overlay>
  );
}

/* ══════════════ TOGGLE STATUS DIALOG ══════════════ */

interface ToggleStatusDialogProps {
  user: User | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function ToggleStatusDialog({ user, onClose, onConfirm }: ToggleStatusDialogProps) {
  if (!user) return null;
  const isActive = user.status === "Active";

  return (
    <Overlay onClose={onClose}>
      <DialogShell
        title={isActive ? "Deactivate User" : "Activate User"}
        subtitle={`${isActive ? "Deactivate" : "Activate"} the account for "${user.username}".`}
        icon={Power}
        iconColor={isActive ? "bg-critical-soft text-critical border-critical" : "bg-good-soft text-good border-good"}
        onClose={onClose}
      >
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-[var(--radius)] border",
              isActive ? "bg-critical-soft border-critical" : "bg-good-soft border-good",
            )}
          >
            <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", isActive ? "text-critical" : "text-good")} />
            <div className="flex flex-col gap-1">
              <span className={cn("text-[13px] font-semibold", isActive ? "text-critical" : "text-good")}>
                {isActive ? "Deactivation Warning" : "Activation Confirmation"}
              </span>
              <span className="text-[12px] text-foreground-muted">
                {isActive
                  ? <>User <strong className="text-foreground">{user.displayName}</strong> will be immediately locked out of all Dark Cascade modules. This action is logged in the immutable audit trail.</>
                  : <>User <strong className="text-foreground">{user.displayName}</strong> will regain access to the system with their existing role ({user.role}). This action is logged in the audit trail.</>
                }
              </span>
            </div>
          </div>

          <ActionRow>
            <CancelBtn onClick={onClose} />
            {isActive ? (
              <DestructiveBtn onClick={() => { onConfirm(user.id); onClose(); }}>
                Deactivate User
              </DestructiveBtn>
            ) : (
              <GoodBtn onClick={() => { onConfirm(user.id); onClose(); }}>
                Activate User
              </GoodBtn>
            )}
          </ActionRow>
        </div>
      </DialogShell>
    </Overlay>
  );
}
