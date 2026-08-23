import {
  getDishImage,
  tomorrowKey,
  type CanteenState,
  type FoodReport,
  type FoodReportStatus,
  type MenuItem,
  type Order,
  type OrderStatus,
  type RecommendationStatus,
  type Student,
  type TomorrowRecommendation,
  type User,
  type WalletTx,
} from "./canteen-store";

const todayKey = () => new Date().toISOString().slice(0, 10);
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
    {
      name: "Veg Thali",
      description: "Rice, dal, seasonal vegetable, pickle",
      price: 90,
      category: "Lunch",
      available: true,
      quantity: 120,
      veg: true,
      image: getDishImage("Veg Thali", "Lunch"),
    },
    {
      name: "Chicken Thali",
      description: "Rice, dal, chicken curry, salad",
      price: 150,
      category: "Lunch",
      available: true,
      quantity: 80,
      veg: false,
      image: getDishImage("Chicken Thali", "Lunch"),
    },
    {
      name: "Veg Momo (10 pcs)",
      description: "Steamed dumplings with tomato achar",
      price: 100,
      category: "Snacks",
      available: true,
      quantity: 60,
      veg: true,
      image: getDishImage("Veg Momo (10 pcs)", "Snacks"),
    },
    {
      name: "Chowmein",
      description: "Stir-fried noodles with vegetables",
      price: 80,
      category: "Snacks",
      available: true,
      quantity: 70,
      veg: true,
      image: getDishImage("Chowmein", "Snacks"),
    },
    {
      name: "Aloo Paratha",
      description: "Two parathas with curd",
      price: 70,
      category: "Breakfast",
      available: true,
      quantity: 50,
      veg: true,
      image: getDishImage("Aloo Paratha", "Breakfast"),
    },
    {
      name: "Boiled Egg Sandwich",
      description: "Whole wheat bread, egg, greens",
      price: 60,
      category: "Breakfast",
      available: true,
      quantity: 40,
      veg: false,
      image: getDishImage("Boiled Egg Sandwich", "Breakfast"),
    },
    {
      name: "Milk Tea",
      description: "Freshly brewed masala tea",
      price: 25,
      category: "Beverages",
      available: true,
      quantity: 200,
      veg: true,
      image: getDishImage("Milk Tea", "Beverages"),
    },
    {
      name: "Lemon Soda",
      description: "Chilled, lightly salted",
      price: 40,
      category: "Beverages",
      available: true,
      quantity: 90,
      veg: true,
      image: getDishImage("Lemon Soda", "Beverages"),
    },
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
      adminResponse:
        "Kitchen team has been notified to serve momos piping hot directly from the steamer. Thank you for your feedback!",
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
      description:
        "Chicken curry taste was excellent, but the portion size of chicken pieces was a bit smaller today.",
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
      description:
        "A bit too much sugar in the morning batch. Please offer lower sugar or unsweetened tea.",
      status: "pending",
      createdAt: Date.now() - 1800000,
    },
  ];
}

function seedTomorrowRecommendations(): TomorrowRecommendation[] {
  return [
    {
      id: "rec-1",
      studentId: "CS2201",
      studentName: "Aayush Khadka",
      studentProgram: "BSc CSIT",
      dishName: "Chicken Biryani",
      category: "Lunch",
      suggestedPrice: 160,
      veg: false,
      image: getDishImage("Chicken Biryani", "Lunch"),
      reason: "Post-hackathon special lunch! Many students want fragrant biryani with raita tomorrow.",
      votes: 24,
      votedBy: ["CS2201", "CS2214", "BBA2109"],
      status: "accepted",
      forDate: tomorrowKey(),
      createdAt: Date.now() - 3600000 * 6,
    },
    {
      id: "rec-2",
      studentId: "CS2214",
      studentName: "Prerana Sharma",
      studentProgram: "BSc CSIT",
      dishName: "Paneer Butter Masala",
      category: "Lunch",
      suggestedPrice: 130,
      veg: true,
      image: getDishImage("Paneer Butter Masala", "Lunch"),
      reason: "High protein vegetarian curry with buttery naan or rice for heavy lab afternoons.",
      votes: 19,
      votedBy: ["CS2214", "BBA2109"],
      status: "voting",
      forDate: tomorrowKey(),
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: "rec-3",
      studentId: "BBA2109",
      studentName: "Nirajan Thapa",
      studentProgram: "BBA",
      dishName: "Samosa Tarkari (2 pcs)",
      category: "Breakfast",
      suggestedPrice: 50,
      veg: true,
      image: getDishImage("Samosa Tarkari (2 pcs)", "Breakfast"),
      reason: "Crispy morning snack under Rs 60 before 8 AM economics lecture.",
      votes: 17,
      votedBy: ["BBA2109"],
      status: "voting",
      forDate: tomorrowKey(),
      createdAt: Date.now() - 3600000 * 3,
    },
    {
      id: "rec-4",
      studentId: "CS2201",
      studentName: "Aayush Khadka",
      studentProgram: "BSc CSIT",
      dishName: "Cold Coffee with Ice Cream",
      category: "Beverages",
      suggestedPrice: 65,
      veg: true,
      image: getDishImage("Cold Coffee with Ice Cream", "Beverages"),
      reason: "Refreshing iced drink for sunny afternoon library sessions.",
      votes: 12,
      votedBy: ["CS2201"],
      status: "voting",
      forDate: tomorrowKey(),
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: "rec-5",
      studentId: "BBA2109",
      studentName: "Nirajan Thapa",
      studentProgram: "BBA",
      dishName: "Fried Rice",
      category: "Snacks",
      suggestedPrice: 100,
      veg: true,
      image: getDishImage("Fried Rice", "Snacks"),
      reason: "Quick wok-tossed vegetable fried rice with chili sauce for evening break.",
      votes: 15,
      votedBy: ["BBA2109", "CS2214"],
      status: "voting",
      forDate: tomorrowKey(),
      createdAt: Date.now() - 3600000,
    },
  ];
}

type ServerData = Omit<CanteenState, "currentUser">;

let serverData: ServerData = {
  users: seedUsers(),
  menu: seedMenu(),
  orders: [],
  students: seedStudents(),
  transactions: [],
  reports: seedReports(),
  recommendations: seedTomorrowRecommendations(),
  nextToken: 104,
  menuDate: todayKey(),
};

export function getServerState(): ServerData {
  if (serverData.menuDate !== todayKey()) {
    serverData.menuDate = todayKey();
    serverData.orders = [];
    serverData.nextToken = 101;
    serverData.menu = serverData.menu.map((m) => ({ ...m, sold: 0 }));
  }
  return serverData;
}

export function handleAction(
  action: string,
  payload: any,
): { ok: boolean; data?: any; error?: string } {
  const s = getServerState();

  switch (action) {
    case "placeOrder": {
      const { studentId, customerName, lines, payment, note } = payload;
      const student = studentId?.trim()
        ? s.students.find((st) => st.id.toLowerCase() === studentId.trim().toLowerCase())
        : undefined;

      if (!lines || lines.length === 0) return { ok: false, error: "Tray is empty." };
      const total = lines.reduce((sum: number, l: any) => sum + l.price * l.qty, 0);

      if (payment === "wallet") {
        if (!student) return { ok: false, error: "Meal plan ID not found." };
        if (student.balance < total) return { ok: false, error: "Insufficient meal plan balance." };
      }

      const order: Order = {
        id: uid(),
        token: s.nextToken,
        studentId: student?.id,
        customerName: customerName?.trim() || student?.name || undefined,
        lines,
        total,
        payment,
        status: "queued",
        placedAt: Date.now(),
        note: note?.trim() || undefined,
      };

      s.nextToken += 1;
      s.orders = [order, ...s.orders];
      s.menu = s.menu.map((m) => {
        const line = lines.find((l: any) => l.itemId === m.id);
        return line ? { ...m, sold: m.sold + line.qty } : m;
      });

      if (payment === "wallet" && student) {
        student.balance -= total;
        s.users = s.users.map((u) =>
          u.id === student.id && u.balance !== undefined ? { ...u, balance: student.balance } : u,
        );
        s.transactions = [
          {
            id: uid(),
            studentId: student.id,
            amount: -total,
            label: `Order #${order.token}`,
            at: Date.now(),
          },
          ...s.transactions,
        ];
      }

      return { ok: true, data: { order, state: s } };
    }

    case "setOrderStatus": {
      const { id, status } = payload;
      s.orders = s.orders.map((o) => (o.id === id ? { ...o, status } : o));
      return { ok: true, data: s };
    }

    case "cancelOrder": {
      const { orderId } = payload;
      const order = s.orders.find((o) => o.id === orderId);
      if (!order) return { ok: false, error: "Order not found." };
      if (order.status === "served" || order.status === "cancelled") {
        return { ok: false, error: "Order cannot be discarded at this stage." };
      }

      // Restore sold portions
      s.menu = s.menu.map((m) => {
        const line = order.lines.find((l: any) => l.itemId === m.id);
        return line ? { ...m, sold: Math.max(0, m.sold - line.qty) } : m;
      });

      // If wallet payment, refund to student balance
      if (order.payment === "wallet" && order.studentId) {
        const student = s.students.find(
          (st) => st.id.toLowerCase() === order.studentId!.toLowerCase(),
        );
        if (student) {
          student.balance += order.total;
          s.users = s.users.map((u) =>
            u.id === student.id && u.balance !== undefined ? { ...u, balance: student.balance } : u,
          );
          s.transactions = [
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

      order.status = "cancelled";
      return { ok: true, data: s };
    }

    case "addUser": {
      const { name, role, program, department, balance, id: customId } = payload;
      if (!name?.trim()) return { ok: false, error: "Name is required." };
      const id =
        customId?.trim().toUpperCase() ||
        `${role.toUpperCase().slice(0, 3)}${Math.floor(1000 + Math.random() * 9000)}`;

      if (s.users.some((u) => u.id.toLowerCase() === id.toLowerCase())) {
        return { ok: false, error: "User ID already exists." };
      }

      const initialBalance = role === "student" ? Math.max(0, Number(balance) || 0) : undefined;
      const newUser: User = {
        id,
        name: name.trim(),
        role,
        program: role === "student" ? program?.trim() || "General Studies" : undefined,
        department: role !== "student" ? department?.trim() || "Operations" : undefined,
        balance: initialBalance,
        createdAt: Date.now(),
      };

      s.users = [newUser, ...s.users];
      if (role === "student") {
        s.students = [
          {
            id: newUser.id,
            name: newUser.name,
            program: newUser.program ?? "General",
            balance: initialBalance ?? 0,
          },
          ...s.students,
        ];
      }
      return { ok: true, data: { user: newUser, state: s } };
    }

    case "removeUser": {
      const { userId } = payload;
      s.users = s.users.filter((u) => u.id !== userId);
      s.students = s.students.filter((st) => st.id !== userId);
      return { ok: true, data: s };
    }

    case "topUp": {
      const { studentId, amount } = payload;
      const student = s.students.find(
        (st) => st.id.toLowerCase() === studentId?.trim().toLowerCase(),
      );
      if (!student) return { ok: false, error: "Student not found." };
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) return { ok: false, error: "Invalid amount." };

      student.balance += amt;
      s.users = s.users.map((u) => (u.id === student.id ? { ...u, balance: student.balance } : u));
      s.transactions = [
        {
          id: uid(),
          studentId: student.id,
          amount: amt,
          label: "Meal plan top-up",
          at: Date.now(),
        },
        ...s.transactions,
      ];
      return { ok: true, data: s };
    }

    case "submitFoodReport": {
      const {
        studentId,
        studentName,
        foodItemId,
        foodItemName,
        category,
        rating,
        description,
        token,
        orderId,
      } = payload;
      const report: FoodReport = {
        id: `rep-${uid()}`,
        orderId,
        token,
        studentId,
        studentName,
        foodItemId,
        foodItemName,
        category,
        rating: Math.min(5, Math.max(1, Number(rating) || 3)),
        description: description?.trim() || "",
        status: "pending",
        createdAt: Date.now(),
      };
      s.reports = [report, ...s.reports];
      return { ok: true, data: { report, state: s } };
    }

    case "resolveFoodReport": {
      const { reportId, status, adminResponse } = payload;
      s.reports = s.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              adminResponse: adminResponse !== undefined ? adminResponse.trim() : r.adminResponse,
              resolvedAt: status === "resolved" ? Date.now() : r.resolvedAt,
            }
          : r,
      );
      return { ok: true, data: s };
    }

    case "deleteFoodReport": {
      const { reportId } = payload;
      s.reports = s.reports.filter((r) => r.id !== reportId);
      return { ok: true, data: s };
    }

    case "addMenuItem": {
      const { name, description, price, quantity, category, veg } = payload;
      s.menu = [
        ...s.menu,
        {
          id: uid(),
          name,
          description,
          price: Number(price),
          quantity: Number(quantity),
          category,
          available: true,
          veg,
          sold: 0,
        },
      ];
      return { ok: true, data: s };
    }

    case "updateMenuItem": {
      const { id, patch } = payload;
      s.menu = s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m));
      return { ok: true, data: s };
    }

    case "removeMenuItem": {
      const { id } = payload;
      s.menu = s.menu.filter((m) => m.id !== id);
      return { ok: true, data: s };
    }

    case "submitTomorrowRecommendation": {
      const {
        studentId,
        studentName,
        studentProgram,
        dishName,
        category,
        suggestedPrice,
        veg,
        reason,
        image,
      } = payload;
      const recommendation: TomorrowRecommendation = {
        id: `rec-${uid()}`,
        studentId,
        studentName,
        studentProgram,
        dishName: dishName?.trim() || "Special Dish",
        category: category || "Lunch",
        suggestedPrice: Math.max(10, Number(suggestedPrice) || 80),
        veg: !!veg,
        image: image || getDishImage(dishName || "", category),
        reason: reason?.trim() || "",
        votes: 1,
        votedBy: [studentId],
        status: "voting",
        forDate: tomorrowKey(),
        createdAt: Date.now(),
      };
      s.recommendations = [recommendation, ...s.recommendations];
      return { ok: true, data: { recommendation, state: s } };
    }

    case "voteTomorrowRecommendation": {
      const { recommendationId, studentId } = payload;
      const rec = s.recommendations.find((r) => r.id === recommendationId);
      if (!rec) return { ok: false, error: "Recommendation not found." };
      const alreadyVoted = rec.votedBy.includes(studentId);
      rec.votedBy = alreadyVoted
        ? rec.votedBy.filter((id) => id !== studentId)
        : [...rec.votedBy, studentId];
      rec.votes = rec.votedBy.length;
      return { ok: true, data: s };
    }

    case "setRecommendationStatus": {
      const { recommendationId, status } = payload;
      s.recommendations = s.recommendations.map((r) =>
        r.id === recommendationId ? { ...r, status } : r,
      );
      return { ok: true, data: s };
    }

    case "deleteTomorrowRecommendation": {
      const { recommendationId } = payload;
      s.recommendations = s.recommendations.filter((r) => r.id !== recommendationId);
      return { ok: true, data: s };
    }

    default:
      return { ok: false, error: `Unknown action "${action}".` };
  }
}

export async function handleCanteenApi(request: Request): Promise<Response> {
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (url.pathname === "/api/canteen/state" && request.method === "GET") {
    return new Response(JSON.stringify({ ok: true, state: getServerState() }), {
      headers: corsHeaders,
      status: 200,
    });
  }

  if (url.pathname === "/api/canteen/action" && request.method === "POST") {
    try {
      const body = await request.json();
      const result = handleAction(body.action, body.payload || {});
      return new Response(JSON.stringify(result), {
        headers: corsHeaders,
        status: result.ok ? 200 : 400,
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ ok: false, error: err?.message || "Invalid JSON" }), {
        headers: corsHeaders,
        status: 400,
      });
    }
  }

  return new Response(JSON.stringify({ ok: false, error: "Not Found" }), {
    headers: corsHeaders,
    status: 404,
  });
}
