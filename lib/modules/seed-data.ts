import type {
  Appointment,
  BusinessType,
  ChecklistItem,
  Customer,
  DocumentItem,
  Note,
  Reminder,
  TaskItem,
  WorkspaceData,
} from "@/types";

interface SeedConfig {
  customers: string[];
  tasks: string[];
  appointmentTitles: string[];
  checklist: string[];
  documentTitles: string[];
  noteTitle: string;
  noteBody: string;
}

const SEED_CONFIG: Record<BusinessType, SeedConfig> = {
  restaurant: {
    customers: ["Dana Reyes (regular, Table 4)", "The Okafor Family", "Jordan Lee (allergy: peanuts)"],
    tasks: ["Confirm Friday reservations", "Call produce supplier about delivery", "Restock bar for weekend"],
    appointmentTitles: ["Party of 6 — dinner", "Birthday reservation — Table 8", "Catering tasting"],
    checklist: ["Walk-in fridge temps logged", "Front of house set up", "Close registers & count drawer"],
    documentTitles: ["Produce invoice — Riverside Foods", "Linen service receipt"],
    noteTitle: "Regulars to remember",
    noteBody: "The Okafors always ask for the corner booth. Dana prefers still water, no ice.",
  },
  cafe: {
    customers: ["Sam (oat milk latte, 8am regular)", "Priya Patel (catering client)", "The Study Group (Tue/Thu)"],
    tasks: ["Order more oat milk", "Fix the espresso grinder", "Post weekend hours"],
    appointmentTitles: ["Office catering pickup", "Private event — closed to public"],
    checklist: ["Machine descaled", "Pastry case restocked", "Till counted and closed"],
    documentTitles: ["Coffee bean invoice", "Pastry supplier receipt"],
    noteTitle: "Regulars to remember",
    noteBody: "Sam is always in a rush before 8:15 — have the oat latte ready when he walks in.",
  },
  salon: {
    customers: ["Maria Chen (color + cut, every 6 weeks)", "Aisha Bello (bridal party lead)", "Tom Alvarez (fade, biweekly)"],
    tasks: ["Order more developer & foils", "Confirm bridal party of 5 for Saturday", "Follow up on cancelled color appt"],
    appointmentTitles: ["Maria Chen — color + cut", "Bridal party — 5 people", "Tom Alvarez — fade"],
    checklist: ["Stations sanitized between clients", "Towels laundered", "Tomorrow's appointments confirmed"],
    documentTitles: ["Color supply invoice", "Booth rent receipt"],
    noteTitle: "Client preferences",
    noteBody: "Maria is sensitive to ammonia — always use the low-ammonia color line.",
  },
  construction: {
    customers: ["Harborview Renovation (Client: the Kims)", "Maple St. Duplex (Investor job)", "Chen Family — Kitchen Remodel"],
    tasks: ["Order lumber for Maple St.", "Schedule inspection — Harborview", "Follow up on change order approval"],
    appointmentTitles: ["Site walkthrough — Harborview", "Inspection — Maple St.", "Client meeting — Chen kitchen"],
    checklist: ["Site secured at end of day", "Tools accounted for", "Crew safety briefing done"],
    documentTitles: ["Lumber supplier invoice", "Permit — Maple St. Duplex", "Change order — Harborview"],
    noteTitle: "Job notes",
    noteBody: "Harborview needs the side gate code (4471) for material deliveries.",
  },
  plumber: {
    customers: ["Acme Property Management", "Nguyen Residence (recurring)", "Downtown Diner (commercial)"],
    tasks: ["Call back Nguyen about the quote", "Order parts for Diner job", "Send invoice for yesterday's call"],
    appointmentTitles: ["Nguyen Residence — leak repair", "Downtown Diner — grease trap", "Acme — routine inspection"],
    checklist: ["Truck restocked", "Invoices sent for today's jobs", "Tomorrow's route confirmed"],
    documentTitles: ["Invoice — Nguyen Residence", "Parts receipt — City Supply"],
    noteTitle: "Job notes",
    noteBody: "Downtown Diner needs after-hours access — call the manager 30 min before arriving.",
  },
  electrician: {
    customers: ["Ridge Apartments (property manager)", "Patel Residence", "Corner Bakery (commercial)"],
    tasks: ["Send quote to Patel Residence", "Order breaker panels", "Follow up on Ridge Apartments invoice"],
    appointmentTitles: ["Patel Residence — panel upgrade", "Ridge Apartments — unit rewiring", "Corner Bakery — safety inspection"],
    checklist: ["Van inventory checked", "Permits filed for the week", "Tomorrow's jobs confirmed"],
    documentTitles: ["Quote — Patel Residence", "Parts invoice — Electrical Supply Co."],
    noteTitle: "Job notes",
    noteBody: "Ridge Apartments requires 24-hour notice before entering any unit.",
  },
  dentist: {
    customers: ["Emily Carter (cleaning, every 6mo)", "The Nguyen Family (4 patients)", "Robert Diaz (crown follow-up)"],
    tasks: ["Confirm tomorrow's schedule", "Order dental supplies", "Follow up on Robert Diaz's crown"],
    appointmentTitles: ["Emily Carter — cleaning", "Nguyen Family — checkups", "Robert Diaz — crown fitting"],
    checklist: ["Rooms sanitized between patients", "Tomorrow's charts prepped", "Supply inventory checked"],
    documentTitles: ["Dental supply invoice", "Insurance claim — R. Diaz"],
    noteTitle: "Patient notes",
    noteBody: "The Nguyen family prefers back-to-back appointments to minimize time off work.",
  },
  gym: {
    customers: ["Alex Kim (personal training, 3x/wk)", "The Morning Crew (6am class regulars)", "Jordan Patel (new member)"],
    tasks: ["Follow up with Jordan after first week", "Order more resistance bands", "Post this week's class schedule"],
    appointmentTitles: ["Alex Kim — personal training", "6am Bootcamp class", "New member orientation — Jordan"],
    checklist: ["Equipment wiped down", "Locker rooms checked", "Class sign-ins collected"],
    documentTitles: ["Equipment maintenance invoice", "Membership agreement — J. Patel"],
    noteTitle: "Member notes",
    noteBody: "Jordan mentioned a knee injury — check in before recommending high-impact classes.",
  },
  retail: {
    customers: ["Loyalty member — Sarah Kim", "Wholesale account — Green Leaf Co.", "Walk-in — frequent Saturday shopper"],
    tasks: ["Reorder best-selling SKUs", "Update window display", "Follow up on wholesale invoice"],
    appointmentTitles: ["Vendor meeting — new spring line", "Wholesale delivery — Green Leaf Co."],
    checklist: ["Register counted at open", "Shelves restocked", "Register counted at close"],
    documentTitles: ["Wholesale invoice — Green Leaf Co.", "Vendor purchase order"],
    noteTitle: "Customer notes",
    noteBody: "Sarah Kim always asks about new arrivals first — worth a heads-up text.",
  },
  cleaning: {
    customers: ["Maple Office Park (weekly contract)", "The Alvarez Residence (biweekly)", "Sunrise Dental (after-hours)"],
    tasks: ["Confirm crew for Monday office job", "Restock cleaning supplies", "Send invoice for Alvarez job"],
    appointmentTitles: ["Maple Office Park — weekly clean", "Alvarez Residence — biweekly clean", "Sunrise Dental — after-hours"],
    checklist: ["Supplies restocked in van", "Client checklist completed on-site", "Keys returned / secured"],
    documentTitles: ["Supply invoice — CleanCo Wholesale", "Invoice — Alvarez Residence"],
    noteTitle: "Job notes",
    noteBody: "Sunrise Dental needs the alarm code (9284) and must be done before 7am opening.",
  },
  other: {
    customers: ["Repeat customer — Jamie Rivera", "New inquiry — via referral", "Long-time client — monthly retainer"],
    tasks: ["Follow up on outstanding invoice", "Prep materials for next client", "Update client contact list"],
    appointmentTitles: ["Client call — Jamie Rivera", "New client consultation"],
    checklist: ["Inbox at zero", "Tomorrow's priorities set", "Invoices up to date"],
    documentTitles: ["Invoice — Jamie Rivera", "Signed agreement — new client"],
    noteTitle: "Client notes",
    noteBody: "Jamie prefers everything over email, never calls.",
  },
};

function isoDaysFromNow(days: number, hour = 9): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

let seedCounter = 0;
function seedId(prefix: string): string {
  seedCounter += 1;
  return `${prefix}-seed-${seedCounter}`;
}

export function buildSeedWorkspaceData(businessType: BusinessType): WorkspaceData {
  const config = SEED_CONFIG[businessType];

  const tasks: TaskItem[] = config.tasks.map((title, i) => ({
    id: seedId("task"),
    title,
    done: false,
    priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
    dueDate: isoDaysFromNow(i),
    createdAt: isoDaysFromNow(-1),
  }));

  const customers: Customer[] = config.customers.map((name, i) => ({
    id: seedId("customer"),
    name,
    phone: `(555) 010-0${i + 1}${i + 1}${i + 1}`,
    email: undefined,
    notes: undefined,
    tags: i === 0 ? ["regular"] : [],
    lastContact: isoDaysFromNow(-i * 3),
  }));

  const notes: Note[] = [
    {
      id: seedId("note"),
      title: config.noteTitle,
      body: config.noteBody,
      pinned: true,
      updatedAt: isoDaysFromNow(-1),
    },
  ];

  const reminders: Reminder[] = [
    {
      id: seedId("reminder"),
      title: `Follow up with ${config.customers[0].split(" (")[0]}`,
      dueDate: isoDaysFromNow(1),
      done: false,
    },
    {
      id: seedId("reminder"),
      title: `Send invoice reminder — ${config.customers[1]?.split(" (")[0] ?? "outstanding client"}`,
      dueDate: isoDaysFromNow(2),
      done: false,
    },
  ];

  const documents: DocumentItem[] = config.documentTitles.map((title, i) => ({
    id: seedId("document"),
    title,
    type: i === 0 ? "invoice" : "receipt",
    status: i === 0 ? "sent" : "paid",
    amount: 120 + i * 85,
    date: isoDaysFromNow(-2 - i),
  }));

  const checklist: ChecklistItem[] = config.checklist.map((title, i) => ({
    id: seedId("checklist"),
    title,
    done: i === 0,
    frequency: "daily",
  }));

  const appointments: Appointment[] = config.appointmentTitles.map((title, i) => ({
    id: seedId("appointment"),
    title,
    customerName: config.customers[i]?.split(" (")[0],
    date: isoDaysFromNow(i + 1, 0),
    time: ["09:00", "11:30", "14:00", "16:30"][i % 4],
    durationMinutes: 60,
  }));

  return { tasks, customers, notes, reminders, documents, checklist, appointments };
}
