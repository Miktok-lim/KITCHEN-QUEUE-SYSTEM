import { useSyncExternalStore } from "react";

export type UserRole = "student" | "staff" | "admin";

export type User = {
  id: string; // e.g. "CS2201", "STAFF01", "ADMIN01"
  name: string;
  role: UserRole;
  program?: string | undefined; // for students (e.g. "BSc CSIT")
  department?: string | undefined; // for staff / admin (e.g. "Kitchen Operations")
  balance?: number | undefined; // for students
  email?: string | undefined;
  createdAt: number;
};

export type FoodReportCategory =
  | "Quality / Taste"
  | "Cold / Temperature"
  | "Portion Size"
  | "Hygiene"
  | "Wrong Item"
  | "Other";

export type FoodReportStatus = "pending" | "investigating" | "resolved";

export type FoodReport = {
  id: string;
  orderId?: string | undefined;
  token?: number | undefined;
  studentId: string;
  studentName: string;
  foodItemId?: string | undefined;
  foodItemName: string;
  category: FoodReportCategory;
  rating: number; // 1 to 5
  description: string;
  status: FoodReportStatus;
  adminResponse?: string | undefined;
  createdAt: number;
  resolvedAt?: number | undefined;
};

export type MealCategory = "Breakfast" | "Lunch" | "Snacks" | "Beverages";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MealCategory;
  available: boolean;
  /** Portions prepared for today */
  quantity: number;
  /** Portions already ordered today */
  sold: number;
  veg: boolean;
};

export type OrderStatus = "queued" | "preparing" | "ready" | "served" | "cancelled";

export type OrderLine = { itemId: string; name: string; price: number; qty: number };

export type Order = {
  id: string;
  token: number;
  studentId?: string | undefined;
  customerName?: string | undefined;
  lines: OrderLine[];
  total: number;
  payment: "wallet" | "cash";
  status: OrderStatus;
  placedAt: number;
  note?: string | undefined;
};

export type Student = {
  id: string;
  name: string;
  program: string;
  balance: number;
};

export type WalletTx = {
  id: string;
  studentId: string;
  amount: number; // positive = top-up, negative = spend
  label: string;
  at: number;
};

export type CanteenState = {
  currentUser: User | null;
  users: User[];
  menu: MenuItem[];
  orders: Order[];
  students: Student[];
  transactions: WalletTx[];
  reports: FoodReport[];
  nextToken: number;
  menuDate: string;
};

const STORAGE_KEY = "college-canteen-state-v4";
const AUTH_KEY = "college-canteen-auth-user-v2";

export const todayKey = () => new Date().toISOString().slice(0, 10);

const uid = () => Math.random().toString(36).slice(2, 10);

function seedUsers(): User[] {
  return [
    {
      id: "CS2201",
      name: "Aayush Khadka",
      role: "student",
      program: "BSc CSIT",
      balance: 1250,
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: "CS2214",
      name: "Prerana Sharma",
      role: "student",
      program: "BSc CSIT",
      balance: 640,
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: "BBA2109",
      name: "Nirajan Thapa",
      role: "student",
      program: "BBA",
      balance: 310,
      createdAt: Date.now() - 86400000 * 15,
    },
    {
      id: "STAFF01",
      name: "Sunita Shrestha",
      role: "staff",
      department: "Kitchen Operations & Head Chef",
      createdAt: Date.now() - 86400000 * 60,
    },
    {
      id: "STAFF02",
      name: "Ram Bahadur Gurung",
      role: "staff",
      department: "Canteen Counter Staff",
      createdAt: Date.now() - 86400000 * 45,
    },
    {
      id: "ADMIN01",
      name: "Prof. Ramesh Adhikari",
      role: "admin",
      department: "Campus Administration & Canteen Committee",
      createdAt: Date.now() - 86400000 * 120,
    },
  ];
}

function seedMenu(): MenuItem[] {
  const base: Array<Omit<MenuItem, "id" | "sold">> = [
    { name: "Veg Thali", description: "Rice, dal, seasonal vegetable, pickle", price: 90, category: "Lunch", available: true, quantity: 120, veg: true },
    { name: "Chicken Thali", description: "Rice, dal, chicken curry, salad", price: 150, category: "Lunch", available: true, quantity: 80, veg: false },
    { name: "Veg Momo (10 pcs)", description: "Steamed dumplings with tomato achar", price: 100, category: "Snacks", available: true, quantity: 60, veg: true },
    { name: "Chowmein", description: "Stir-fried noodles with vegetables", price: 80, category: "Snacks", available: true, quantity: 70, veg: true },
    { name: "Aloo Paratha", description: "Two parathas with curd", price: 70, category: "Breakfast", available: true, quantity: 50, veg: true },
    { name: "Boiled Egg Sandwich", description: "Whole wheat bread, egg, greens", price: 60, category: "Breakfast", available: true, quantity: 40, veg: false },
    { name: "Milk Tea", description: "Freshly brewed masala tea", price: 25, category: "Beverages", available: true, quantity: 200, veg: true },
    { name: "Lemon Soda", description: "Chilled, lightly salted", price: 40, category: "Beverages", available: true, quantity: 90, veg: true },
  ];
  return base.map((m) => ({ ...m, id: uid(), sold: 0 }));
}

function seedStudents(): Student[] {
  return [
    { id: "CS2201", name: "Aayush Khadka", program: "BSc CSIT", balance: 1250 },
    { id: "CS2214", name: "Prerana Sharma", program: "BSc CSIT", balance: 640 },
    { id: "BBA2109", name: "Nirajan Thapa", program: "BBA", balance: 310 },
  ];
}

function seedReports(): FoodReport[] {
  return [
    {
      id: "rep-1",
      token: 101,
      studentId: "CS2201",
      studentName: "Aayush Khadka",
      foodItemName: "Veg Momo (10 pcs)",
      category: "Cold / Temperature",
      rating: 2,
      description: "The momos served at lunch were lukewarm and the spicy achar was running out.",
      status: "resolved",
      adminResponse: "Kitchen team has been notified to serve momos piping hot directly from the steamer. Thank you for your feedback!",
      createdAt: Date.now() - 3600000 * 5,
      resolvedAt: Date.now() - 3600000 * 2,
    },
    {
      id: "rep-2",
      token: 102,
      studentId: "CS2214",
      studentName: "Prerana Sharma",
      foodItemName: "Chicken Thali",
      category: "Portion Size",
      rating: 3,
      description: "Chicken curry taste was excellent, but the portion size of chicken pieces was a bit smaller today.",
      status: "investigating",
      createdAt: Date.now() - 3600000 * 3,
    },
    {
      id: "rep-3",
      studentId: "BBA2109",
      studentName: "Nirajan Thapa",
      foodItemName: "Milk Tea",
      category: "Quality / Taste",
      rating: 2,
      description: "A bit too much sugar in the morning batch. Please offer lower sugar or unsweetened tea.",
      status: "pending",
      createdAt: Date.now() - 1800000,
    },
  ];
}

function seedState(): CanteenState {
  const users = seedUsers();
  return {
    currentUser: users[0] ?? null,
    users,
    menu: seedMenu(),
    orders: [],
    students: seedStudents(),
    transactions: [],
    reports: seedReports(),
    nextToken: 104,
    menuDate: todayKey(),
  };
}

let state: CanteenState = seedState();
let hydrated = false;
let pollingStarted = false;
const listeners = new Set<() => void>();

function persistLocal() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (state.currentUser) {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(state.currentUser));
    } else {
      window.localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    /* ignore quota errors */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

async function fetchServerState() {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/canteen/state");
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.ok && data.state) {
      const serverState = data.state;
      state = {
        ...state,
        menu: serverState.menu,
        orders: serverState.orders,
        users: serverState.users,
        students: serverState.students,
        transactions: serverState.transactions,
        reports: serverState.reports,
        nextToken: serverState.nextToken,
        menuDate: serverState.menuDate,
        currentUser: state.currentUser
          ? serverState.users.find((u: User) => u.id === state.currentUser?.id) ?? state.currentUser
          : state.currentUser,
      };
      persistLocal();
      emit();
    }
  } catch {
    /* ignore network failure */
  }
}

async function sendServerAction(action: string, payload: any) {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/canteen/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.data) {
        const serverState = json.data.state || (json.data.order ? json.data.state : json.data);
        if (serverState && Array.isArray(serverState.orders)) {
          state = {
            ...state,
            menu: serverState.menu,
            orders: serverState.orders,
            users: serverState.users,
            students: serverState.students,
            transactions: serverState.transactions,
            reports: serverState.reports,
            nextToken: serverState.nextToken,
            currentUser: state.currentUser
              ? serverState.users.find((u: User) => u.id === state.currentUser?.id) ?? state.currentUser
              : state.currentUser,
          };
          persistLocal();
          emit();
        }
      }
    }
  } catch (err) {
    console.error("Failed to sync action with server:", err);
  }
}

function startPolling() {
  if (pollingStarted || typeof window === "undefined") return;
  pollingStarted = true;
  fetchServerState();
  setInterval(() => {
    fetchServerState();
  }, 1200);
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const rawAuth = window.localStorage.getItem(AUTH_KEY);
    if (rawAuth) {
      const parsedUser = JSON.parse(rawAuth) as User;
      if (parsedUser && parsedUser.id) {
        state.currentUser = parsedUser;
      }
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CanteenState;
      if (parsed && Array.isArray(parsed.menu) && Array.isArray(parsed.users)) {
        state = {
          ...parsed,
          reports: Array.isArray(parsed.reports) ? parsed.reports : seedReports(),
          currentUser: state.currentUser ?? parsed.currentUser ?? parsed.users[0] ?? null,
        };
      }
    }
  } catch {
    /* ignore corrupt storage */
  }

  startPolling();
  emit();
}

function setState(updater: (s: CanteenState) => CanteenState) {
  state = updater(state);
  persistLocal();
  emit();
}

export function useCanteen<T>(selector: (s: CanteenState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      hydrate();
      return () => listeners.delete(cb);
    },
    () => selector(state),
    () => selector(state),
  );
}

export const remaining = (item: MenuItem) => Math.max(0, item.quantity - item.sold);

/* ---------- Auth actions ---------- */

export function login(userId: string): { ok: boolean; user?: User; error?: string } {
  const user = state.users.find((u) => u.id.toLowerCase() === userId.trim().toLowerCase());
  if (!user) return { ok: false, error: `No account found with ID "${userId}".` };
  setState((s) => ({ ...s, currentUser: user }));
  return { ok: true, user };
}

export function loginAsRole(role: UserRole): User {
  const match = state.users.find((u) => u.role === role) ?? state.users[0]!;
  setState((s) => ({ ...s, currentUser: match }));
  return match;
}

export function logout() {
  setState((s) => ({ ...s, currentUser: null }));
}

/* ---------- User Management (Admin Authority) ---------- */

export type AddUserInput = {
  id?: string;
  name: string;
  role: UserRole;
  program?: string;
  department?: string;
  balance?: number;
};

export function addUser(input: AddUserInput): { ok: boolean; user?: User; error?: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name cannot be empty." };

  const id = input.id?.trim().toUpperCase() || `${input.role.toUpperCase().slice(0, 3)}${Math.floor(1000 + Math.random() * 9000)}`;

  if (state.users.some((u) => u.id.toLowerCase() === id.toLowerCase())) {
    return { ok: false, error: `User with ID "${id}" already exists.` };
  }

  const initialBalance = input.role === "student" ? Math.max(0, Number(input.balance) || 0) : undefined;

  const newUser: User = {
    id,
    name,
    role: input.role,
    program: input.role === "student" ? input.program?.trim() || "General Studies" : undefined,
    department: input.role !== "student" ? input.department?.trim() || "Operations" : undefined,
    balance: initialBalance,
    createdAt: Date.now(),
  };

  setState((s) => {
    const updatedUsers = [newUser, ...s.users];
    let updatedStudents = s.students;
    if (newUser.role === "student") {
      updatedStudents = [
        {
          id: newUser.id,
          name: newUser.name,
          program: newUser.program ?? "General",
          balance: initialBalance ?? 0,
        },
        ...s.students,
      ];
    }
    return {
      ...s,
      users: updatedUsers,
      students: updatedStudents,
    };
  });

  sendServerAction("addUser", { ...input, id });
  return { ok: true, user: newUser };
}

export function removeUser(userId: string): { ok: boolean; error?: string } {
  const user = state.users.find((u) => u.id === userId);
  if (!user) return { ok: false, error: "User not found." };

  setState((s) => {
    const remainingUsers = s.users.filter((u) => u.id !== userId);
    let nextCurrent = s.currentUser;
    if (s.currentUser?.id === userId) {
      nextCurrent = remainingUsers.find((u) => u.role === "admin") ?? remainingUsers[0] ?? null;
    }
    return {
      ...s,
      users: remainingUsers,
      students: s.students.filter((st) => st.id !== userId),
      currentUser: nextCurrent,
    };
  });

  sendServerAction("removeUser", { userId });
  return { ok: true };
}

export function updateUser(userId: string, patch: Partial<User>) {
  setState((s) => ({
    ...s,
    users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    students: s.students.map((st) =>
      st.id === userId
        ? {
            ...st,
            name: patch.name ?? st.name,
            program: patch.program ?? st.program,
            balance: patch.balance !== undefined ? patch.balance : st.balance,
          }
        : st,
    ),
    currentUser: s.currentUser?.id === userId ? { ...s.currentUser, ...patch } : s.currentUser,
  }));
}

/* ---------- Food Reports & Complaints System ---------- */

export type SubmitReportInput = {
  orderId?: string;
  token?: number;
  foodItemId?: string;
  foodItemName: string;
  category: FoodReportCategory;
  rating: number;
  description: string;
};

export function submitFoodReport(input: SubmitReportInput): { ok: boolean; report?: FoodReport; error?: string } {
  if (!state.currentUser) return { ok: false, error: "Please log in to submit a report." };
  if (!input.foodItemName?.trim()) return { ok: false, error: "Please specify the food item." };
  if (!input.description?.trim()) return { ok: false, error: "Please write a brief description of the issue." };

  const report: FoodReport = {
    id: `rep-${uid()}`,
    orderId: input.orderId,
    token: input.token,
    studentId: state.currentUser.id,
    studentName: state.currentUser.name,
    foodItemId: input.foodItemId,
    foodItemName: input.foodItemName.trim(),
    category: input.category,
    rating: Math.min(5, Math.max(1, input.rating || 3)),
    description: input.description.trim(),
    status: "pending",
    createdAt: Date.now(),
  };

  setState((s) => ({
    ...s,
    reports: [report, ...s.reports],
  }));

  sendServerAction("submitFoodReport", {
    ...input,
    studentId: state.currentUser.id,
    studentName: state.currentUser.name,
  });

  return { ok: true, report };
}

export function resolveFoodReport(
  reportId: string,
  status: FoodReportStatus,
  adminResponse?: string,
): { ok: boolean; error?: string } {
  const report = state.reports.find((r) => r.id === reportId);
  if (!report) return { ok: false, error: "Report not found." };

  setState((s) => ({
    ...s,
    reports: s.reports.map((r) =>
      r.id === reportId
        ? {
            ...r,
            status,
            adminResponse: adminResponse !== undefined ? adminResponse.trim() : r.adminResponse,
            resolvedAt: status === "resolved" ? Date.now() : r.resolvedAt,
          }
        : r,
    ),
  }));

  sendServerAction("resolveFoodReport", { reportId, status, adminResponse });
  return { ok: true };
}

export function deleteFoodReport(reportId: string): { ok: boolean } {
  setState((s) => ({
    ...s,
    reports: s.reports.filter((r) => r.id !== reportId),
  }));
  sendServerAction("deleteFoodReport", { reportId });
  return { ok: true };
}

/* ---------- menu planner actions ---------- */

export function addMenuItem(item: Omit<MenuItem, "id" | "sold">) {
  const newItem = { ...item, id: uid(), sold: 0 };
  setState((s) => ({ ...s, menu: [...s.menu, newItem] }));
  sendServerAction("addMenuItem", item);
}

export function updateMenuItem(id: string, patch: Partial<MenuItem>) {
  setState((s) => ({
    ...s,
    menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)),
  }));
  sendServerAction("updateMenuItem", { id, patch });
}

export function removeMenuItem(id: string) {
  setState((s) => ({ ...s, menu: s.menu.filter((m) => m.id !== id) }));
  sendServerAction("removeMenuItem", { id });
}

/* ---------- ordering ---------- */

export type PlaceOrderInput = {
  studentId?: string;
  customerName?: string;
  lines: OrderLine[];
  payment: "wallet" | "cash";
  note?: string;
};

export function placeOrder(input: PlaceOrderInput): { ok: true; order: Order } | { ok: false; error: string } {
  const student = input.studentId?.trim()
    ? state.students.find((st) => st.id.toLowerCase() === input.studentId!.trim().toLowerCase())
    : undefined;
  if (input.lines.length === 0) return { ok: false, error: "Your tray is empty." };

  const total = input.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  if (input.payment === "wallet") {
    if (!student) return { ok: false, error: "Enter a valid meal plan ID to pay from a meal plan." };
    if (student.balance < total) {
      return { ok: false, error: `Meal plan balance is short by Rs ${total - student.balance}.` };
    }
  }

  for (const line of input.lines) {
    const item = state.menu.find((m) => m.id === line.itemId);
    if (!item || !item.available) return { ok: false, error: `${line.name} is no longer being served.` };
    if (remaining(item) < line.qty) return { ok: false, error: `Only ${remaining(item)} portions of ${line.name} left.` };
  }

  const order: Order = {
    id: uid(),
    token: state.nextToken,
    studentId: student?.id,
    customerName: input.customerName?.trim() || student?.name || undefined,
    lines: input.lines,
    total,
    payment: input.payment,
    status: "queued",
    placedAt: Date.now(),
    note: input.note?.trim() || undefined,
  };

  setState((s) => ({
    ...s,
    nextToken: s.nextToken + 1,
    orders: [order, ...s.orders],
    menu: s.menu.map((m) => {
      const line = input.lines.find((l) => l.itemId === m.id);
      return line ? { ...m, sold: m.sold + line.qty } : m;
    }),
    students: s.students.map((st) =>
      student && st.id === student.id && input.payment === "wallet" ? { ...st, balance: st.balance - total } : st,
    ),
    users: s.users.map((u) =>
      student && u.id === student.id && input.payment === "wallet" && u.balance !== undefined
        ? { ...u, balance: u.balance - total }
        : u,
    ),
    currentUser:
      s.currentUser && student && s.currentUser.id === student.id && input.payment === "wallet" && s.currentUser.balance !== undefined
        ? { ...s.currentUser, balance: s.currentUser.balance - total }
        : s.currentUser,
    transactions:
      input.payment === "wallet" && student
        ? [
            { id: uid(), studentId: student.id, amount: -total, label: `Order #${order.token}`, at: Date.now() },
            ...s.transactions,
          ]
        : s.transactions,
  }));

  sendServerAction("placeOrder", input);

  return { ok: true, order };
}

export function setOrderStatus(id: string, status: OrderStatus) {
  setState((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
  sendServerAction("setOrderStatus", { id, status });
}

export function cancelOrder(orderId: string): { ok: boolean; error?: string } {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status === "served" || order.status === "cancelled") {
    return { ok: false, error: "Order cannot be discarded." };
  }

  setState((s) => {
    const updatedMenu = s.menu.map((m) => {
      const line = order.lines.find((l) => l.itemId === m.id);
      return line ? { ...m, sold: Math.max(0, m.sold - line.qty) } : m;
    });

    let updatedStudents = s.students;
    let updatedUsers = s.users;
    let updatedTx = s.transactions;
    let updatedCurrentUser = s.currentUser;

    if (order.payment === "wallet" && order.studentId) {
      const student = s.students.find((st) => st.id.toLowerCase() === order.studentId!.toLowerCase());
      if (student) {
        const newBal = student.balance + order.total;
        updatedStudents = s.students.map((st) => (st.id === student.id ? { ...st, balance: newBal } : st));
        updatedUsers = s.users.map((u) => (u.id === student.id ? { ...u, balance: newBal } : u));
        if (s.currentUser?.id === student.id) {
          updatedCurrentUser = { ...s.currentUser, balance: newBal };
        }
        updatedTx = [
          {
            id: uid(),
            studentId: student.id,
            amount: order.total,
            label: `Refund: Order #${order.token} discarded`,
            at: Date.now(),
          },
          ...s.transactions,
        ];
      }
    }

    return {
      ...s,
      menu: updatedMenu,
      students: updatedStudents,
      users: updatedUsers,
      transactions: updatedTx,
      currentUser: updatedCurrentUser,
      orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
    };
  });

  sendServerAction("cancelOrder", { orderId });
  return { ok: true };
}

/* ---------- wallet ---------- */

export function findStudent(id: string): Student | undefined {
  return state.students.find((s) => s.id.toLowerCase() === id.trim().toLowerCase());
}

export function topUp(studentId: string, amount: number): { ok: boolean; error?: string } {
  const student = findStudent(studentId);
  if (!student) return { ok: false, error: "Student ID not found." };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter an amount greater than zero." };
  setState((s) => ({
    ...s,
    students: s.students.map((st) => (st.id === student.id ? { ...st, balance: st.balance + amount } : st)),
    users: s.users.map((u) => (u.id === student.id ? { ...u, balance: (u.balance ?? 0) + amount } : u)),
    currentUser:
      s.currentUser?.id === student.id ? { ...s.currentUser, balance: (s.currentUser.balance ?? 0) + amount } : s.currentUser,
    transactions: [
      { id: uid(), studentId: student.id, amount, label: "Meal plan top-up", at: Date.now() },
      ...s.transactions,
    ],
  }));
  sendServerAction("topUp", { studentId, amount });
  return { ok: true };
}

export const money = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;
