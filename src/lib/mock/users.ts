import { useState, useMemo } from "react";

/* ───────── Types ───────── */

export type UserRole = "Operator" | "Technician" | "Manager";
export type UserStatus = "Active" | "Inactive";

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  lastLogin: string | null;
  status: UserStatus;
  createdAt: string;
}

export type ActivityAction =
  | "User Created"
  | "User Edited"
  | "User Deactivated"
  | "User Activated"
  | "Password Reset";

export interface ActivityEvent {
  id: string;
  timestamp: string;
  action: ActivityAction;
  actor: string;
  targetUser: string;
  details: string;
}

/* ───────── Seed data ───────── */

const SEED_USERS: User[] = [
  { id: "u1", username: "mahesh",    displayName: "Mahesh",          role: "Operator",   lastLogin: null,                   status: "Active",   createdAt: "2026-03-10T08:00:00Z" },
  { id: "u2", username: "pooja",     displayName: "Pooja",           role: "Operator",   lastLogin: null,                   status: "Active",   createdAt: "2026-03-10T08:05:00Z" },
  { id: "u3", username: "nick",      displayName: "Nick",            role: "Operator",   lastLogin: "25 Apr 2026 15:17",    status: "Active",   createdAt: "2026-03-12T10:00:00Z" },
  { id: "u4", username: "nikki",     displayName: "Nikki Mamplata",  role: "Manager",    lastLogin: "27 Apr 2026 16:22",    status: "Active",   createdAt: "2026-03-15T09:00:00Z" },
  { id: "u5", username: "anna",      displayName: "Anna Cruz",       role: "Technician", lastLogin: null,                   status: "Inactive", createdAt: "2026-03-18T11:00:00Z" },
  { id: "u6", username: "jose",      displayName: "Jose Reyes",      role: "Technician", lastLogin: "25 Apr 2026 13:48",    status: "Active",   createdAt: "2026-03-20T08:30:00Z" },
  { id: "u7", username: "maria",     displayName: "Maria Santos",    role: "Operator",   lastLogin: null,                   status: "Active",   createdAt: "2026-03-22T14:00:00Z" },
  { id: "u8", username: "bhushan_m", displayName: "Bhushan",         role: "Manager",    lastLogin: "29 Apr 2026 10:19",    status: "Active",   createdAt: "2026-03-25T07:00:00Z" },
  { id: "u9", username: "admin",     displayName: "Admin",           role: "Manager",    lastLogin: "23 Apr 2026 13:52",    status: "Inactive", createdAt: "2026-03-01T06:00:00Z" },
];

const SEED_ACTIVITY: ActivityEvent[] = [
  { id: "a1",  timestamp: "29 Apr 2026 10:22", action: "User Edited",       actor: "bhushan_m", targetUser: "nick",      details: "Role changed from Technician → Operator" },
  { id: "a2",  timestamp: "29 Apr 2026 09:45", action: "Password Reset",    actor: "bhushan_m", targetUser: "pooja",     details: "Password reset by manager" },
  { id: "a3",  timestamp: "28 Apr 2026 16:10", action: "User Deactivated",  actor: "nikki",     targetUser: "admin",     details: "Account deactivated" },
  { id: "a4",  timestamp: "28 Apr 2026 14:30", action: "User Created",      actor: "nikki",     targetUser: "maria",     details: "New user created with role Operator" },
  { id: "a5",  timestamp: "27 Apr 2026 11:15", action: "User Activated",    actor: "bhushan_m", targetUser: "jose",      details: "Account reactivated" },
  { id: "a6",  timestamp: "27 Apr 2026 09:00", action: "User Edited",       actor: "nikki",     targetUser: "mahesh",    details: "Display name updated" },
  { id: "a7",  timestamp: "26 Apr 2026 15:45", action: "Password Reset",    actor: "nikki",     targetUser: "anna",      details: "Password reset by manager" },
  { id: "a8",  timestamp: "25 Apr 2026 10:30", action: "User Deactivated",  actor: "bhushan_m", targetUser: "anna",      details: "Account deactivated — inactive for 30 days" },
  { id: "a9",  timestamp: "24 Apr 2026 08:00", action: "User Created",      actor: "nikki",     targetUser: "bhushan_m", details: "New user created with role Manager" },
  { id: "a10", timestamp: "23 Apr 2026 14:20", action: "User Edited",       actor: "bhushan_m", targetUser: "nikki",     details: "Role changed from Operator → Manager" },
  { id: "a11", timestamp: "22 Apr 2026 09:10", action: "User Created",      actor: "admin",     targetUser: "jose",      details: "New user created with role Technician" },
  { id: "a12", timestamp: "20 Apr 2026 16:00", action: "Password Reset",    actor: "admin",     targetUser: "mahesh",    details: "Password reset by manager" },
];

/* ───────── Hook ───────── */

export type RoleFilter = UserRole | "All";
export type StatusFilter = UserStatus | "All";
export type ActivityFilter = ActivityAction | "All";

export interface UsersState {
  /* data */
  users: User[];
  activityLog: ActivityEvent[];
  /* counts */
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  roleCounts: Record<UserRole, number>;
  /* filters */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roleFilter: RoleFilter;
  setRoleFilter: (r: RoleFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  activityFilter: ActivityFilter;
  setActivityFilter: (a: ActivityFilter) => void;
  /* pagination */
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  totalPages: number;
  /* filtered */
  filteredUsers: User[];
  pagedUsers: User[];
  filteredActivity: ActivityEvent[];
  /* mutations */
  addUser: (u: Omit<User, "id" | "createdAt" | "lastLogin" | "status">) => void;
  updateUser: (id: string, patch: Partial<Pick<User, "displayName" | "role">>) => void;
  toggleStatus: (id: string) => void;
  resetPassword: (id: string) => void;
}

let nextUserId = 100;
let nextEventId = 100;

function nowStamp(): string {
  const d = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function useUsersState(): UsersState {
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [activity, setActivity] = useState<ActivityEvent[]>(SEED_ACTIVITY);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* Counts */
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === "Active").length;
  const inactiveCount = users.filter((u) => u.status === "Inactive").length;
  const roleCounts: Record<UserRole, number> = {
    Operator:   users.filter((u) => u.role === "Operator").length,
    Technician: users.filter((u) => u.role === "Technician").length,
    Manager:    users.filter((u) => u.role === "Manager").length,
  };

  /* Filtered users */
  const filteredUsers = useMemo(() => {
    let result = [...users];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q),
      );
    }
    if (roleFilter !== "All") result = result.filter((u) => u.role === roleFilter);
    if (statusFilter !== "All") result = result.filter((u) => u.status === statusFilter);
    return result;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  /* Filtered activity */
  const filteredActivity = useMemo(() => {
    if (activityFilter === "All") return activity;
    return activity.filter((e) => e.action === activityFilter);
  }, [activity, activityFilter]);

  /* Mutations */
  function pushEvent(action: ActivityAction, targetUser: string, details: string) {
    setActivity((prev) => [
      { id: `a${++nextEventId}`, timestamp: nowStamp(), action, actor: "bhushan_m", targetUser, details },
      ...prev,
    ]);
  }

  function addUser(u: Omit<User, "id" | "createdAt" | "lastLogin" | "status">) {
    const newUser: User = {
      ...u,
      id: `u${++nextUserId}`,
      lastLogin: null,
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    pushEvent("User Created", u.username, `New user created with role ${u.role}`);
  }

  function updateUser(id: string, patch: Partial<Pick<User, "displayName" | "role">>) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    );
    const user = users.find((u) => u.id === id);
    if (user) {
      const changes: string[] = [];
      if (patch.displayName && patch.displayName !== user.displayName) changes.push(`Display name updated`);
      if (patch.role && patch.role !== user.role) changes.push(`Role changed from ${user.role} → ${patch.role}`);
      pushEvent("User Edited", user.username, changes.join("; ") || "User details updated");
    }
  }

  function toggleStatus(id: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u,
      ),
    );
    const user = users.find((u) => u.id === id);
    if (user) {
      const newStatus = user.status === "Active" ? "Inactive" : "Active";
      pushEvent(
        newStatus === "Inactive" ? "User Deactivated" : "User Activated",
        user.username,
        newStatus === "Inactive" ? "Account deactivated" : "Account reactivated",
      );
    }
  }

  function resetPassword(id: string) {
    const user = users.find((u) => u.id === id);
    if (user) {
      pushEvent("Password Reset", user.username, "Password reset by manager");
    }
  }

  return {
    users,
    activityLog: activity,
    totalCount,
    activeCount,
    inactiveCount,
    roleCounts,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    activityFilter,
    setActivityFilter,
    page,
    setPage: (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    pageSize,
    totalPages,
    filteredUsers,
    pagedUsers,
    filteredActivity,
    addUser,
    updateUser,
    toggleStatus,
    resetPassword,
  };
}
