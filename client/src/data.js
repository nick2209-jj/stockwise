export const starterProducts = [
  { id: "p1", name: "Ceramic Pour-over Set", sku: "KT-2048", category: "Kitchen", price: 42, stock: 18, icon: "☕", description: "Hand-finished ceramic coffee set." },
  { id: "p2", name: "Linen Table Runner", sku: "HM-1092", category: "Home", price: 36, stock: 6, icon: "🧵", description: "Natural linen table runner." },
  { id: "p3", name: "Everyday Tote Bag", sku: "AC-3301", category: "Accessories", price: 28, stock: 42, icon: "👜", description: "Reusable canvas tote bag." },
  { id: "p4", name: "Wildflower Candle", sku: "HM-1056", category: "Home", price: 24, stock: 4, icon: "🕯️", description: "Soy wax candle with a floral scent." },
  { id: "p5", name: "Stoneware Mug", sku: "KT-2077", category: "Kitchen", price: 19, stock: 31, icon: "🏺", description: "Wheel-thrown stoneware mug." },
  { id: "p6", name: "Botanical Print Set", sku: "AR-7810", category: "Art & Prints", price: 32, stock: 0, icon: "🖼️", description: "Set of two botanical art prints." },
  { id: "p7", name: "Woven Market Basket", sku: "AC-3388", category: "Accessories", price: 54, stock: 8, icon: "🧺", description: "Handwoven everyday market basket." },
  { id: "p8", name: "Glass Water Bottle", sku: "KT-2014", category: "Kitchen", price: 22, stock: 25, icon: "🫙", description: "Glass bottle with a protective sleeve." },
];

export const starterOrders = [
  { id: "ORD-2084", customer: "Olivia Rhye", initials: "OR", date: "Oct 16, 2026", amount: 128, status: "Pending", items: 3, contact: "olivia@example.com" },
  { id: "ORD-2083", customer: "Phoenix Baker", initials: "PB", date: "Oct 16, 2026", amount: 76, status: "Confirmed", items: 2, contact: "phoenix@example.com" },
  { id: "ORD-2082", customer: "Lana Steiner", initials: "LS", date: "Oct 15, 2026", amount: 214, status: "Shipped", items: 4, contact: "lana@example.com" },
  { id: "ORD-2081", customer: "Demi Wilkinson", initials: "DW", date: "Oct 15, 2026", amount: 42, status: "Pending", items: 1, contact: "demi@example.com" },
  { id: "ORD-2080", customer: "Candice Wu", initials: "CW", date: "Oct 14, 2026", amount: 96, status: "Confirmed", items: 2, contact: "candice@example.com" },
  { id: "ORD-2079", customer: "Natali Craig", initials: "NC", date: "Oct 13, 2026", amount: 58, status: "Cancelled", items: 1, contact: "natali@example.com" },
];

export const starterMovements = [
  { id: "m1", productId: "p1", quantity: 8, reason: "Supplier delivery", user: "Jamie Diaz", date: "Oct 16, 2026 · 10:42 AM" },
  { id: "m2", productId: "p2", quantity: -2, reason: "Damaged in storage", user: "Jamie Diaz", date: "Oct 16, 2026 · 09:18 AM" },
  { id: "m3", productId: "p4", quantity: 12, reason: "Supplier delivery", user: "Jamie Diaz", date: "Oct 15, 2026 · 04:30 PM" },
  { id: "m4", productId: "p7", quantity: -1, reason: "Order fulfilment", user: "Jamie Diaz", date: "Oct 15, 2026 · 11:06 AM" },
  { id: "m5", productId: "p5", quantity: 10, reason: "Supplier delivery", user: "Jamie Diaz", date: "Oct 14, 2026 · 02:21 PM" },
];

export const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value) || 0);
export const todayString = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const timeString = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
export const productStatus = (product) => product.stock <= 0 ? ["Out of stock", "cancelled"] : product.stock < 10 ? ["Low stock", "pending"] : ["In stock", "shipped"];
