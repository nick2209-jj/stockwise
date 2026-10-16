import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("ioms_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthSubmission = requestUrl.endsWith("/auth/login") || requestUrl.endsWith("/auth/register");
    if (error.response?.status === 401 && !isAuthSubmission && sessionStorage.getItem("ioms_token")) {
      sessionStorage.removeItem("ioms_token");
      window.dispatchEvent(new Event("ioms:logout"));
    }
    return Promise.reject(error);
  }
);

export function apiError(error) {
  return error.response?.data?.message || error.message || "The request could not be completed.";
}

function directImageUrl(value) {
  if (!value) return "https://via.placeholder.com/150?text=No+Image";
  try {
    const url = new URL(value);
    if (/(^|\.)google\.[a-z.]+$/i.test(url.hostname) && /\/imgres\/?$/i.test(url.pathname)) {
      const imageUrl = url.searchParams.get("imgurl") || url.searchParams.get("mediaurl");
      if (imageUrl) {
        const directUrl = new URL(imageUrl);
        if (directUrl.protocol === "https:" || directUrl.protocol === "http:") return directUrl.toString();
      }
      return "https://via.placeholder.com/150?text=No+Image";
    }
  } catch {
    return "https://via.placeholder.com/150?text=No+Image";
  }
  return value;
}

export const normalizeProduct = (product) => ({
  ...product,
  id: product._id || product.id,
  stock: product.stockQuantity ?? product.stock ?? 0,
  imageUrl: product.imageUrl?.startsWith("/uploads/")
    ? new URL(product.imageUrl, new URL(api.defaults.baseURL, window.location.origin).origin).toString()
    : directImageUrl(product.imageUrl),
});

export const normalizeOrder = (order) => ({
  ...order,
  id: order._id || order.id,
  customer: order.customerName || order.customer,
  contact: order.customerContact || order.contact,
  amount: order.total ?? order.amount,
  date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : order.date,
  items: order.items?.reduce ? order.items.reduce((sum, item) => sum + Number(item.quantity), 0) : order.items,
  lineItems: order.items?.map ? order.items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.unitPrice, productName: item.productName })) : order.lineItems,
});

export const normalizeMovement = (movement) => ({
  ...movement,
  id: movement._id || movement.id,
  productId: movement.productId?._id || movement.productId,
  productName: movement.productId?.name,
  sku: movement.productId?.sku,
  quantity: movement.quantityChange ?? movement.quantity,
  user: movement.userId?.name || movement.user || "Admin",
  date: movement.createdAt ? new Date(movement.createdAt).toLocaleString() : movement.date,
});

export default api;
