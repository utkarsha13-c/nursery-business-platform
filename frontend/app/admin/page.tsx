"use client";

import { useEffect, useState } from "react";

/* =========================================================
   TYPES
========================================================= */

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

type Product = {
  id: number;
  category_id?: number;
  category?: string;
  category_name?: string;

  name: string;
  description: string;
  price: number;
  unit: string;
  stock_quantity: number;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

type Order = {
  id: number;
  customer_id : number;
  customer_name: string;
  customer_email: string;
  total_amount: number | string;
  status: string;
  created_at: string;
};
type Category = {
  id: number;
  name: string;
};
type RequestItem = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  status: string;
  message: string | null;
  created_at: string;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string | number;
};
/* =========================================================
   API CONFIGURATION
========================================================= */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/*
  Your login should save JWT like:

  localStorage.setItem("token", data.token);

  If you used another key, change "token" below.
*/

/* =========================================================
   ADMIN PAGE
========================================================= */

export default function AdminPage() {
  const [activePage, setActivePage] = useState("Dashboard");

  /* ---------------- USERS ---------------- */

 const [users, setUser] = useState<User[]>([]);
const [order, setOrder] = useState<Order[]>([]);
  /* ---------------- PRODUCTS ---------------- */

  const [products, setProducts] = useState<Product[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(true);

  const [productError, setProductError] = useState("");
  const [userError, setUserError] = useState("");
  
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
const [orderError, setOrderError] =
  useState("");
  /* ---------------- PRODUCT FORM ---------------- */

  const [showProductForm, setShowProductForm] = useState(false);

  const [editingProductId, setEditingProductId] =
    useState<number | null>(null);

  const [savingProduct, setSavingProduct] = useState(false);
  const [inventory, setInventory] =
  useState<any[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
const [showNotifications, setShowNotifications] = useState(false);
const [loadingRequests, setLoadingRequests] = useState(false);

const [loadingInventory, setLoadingInventory] =
  useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    unit: "piece",
    stock_quantity: "",
  });
  const [nurserySettings, setNurserySettings] = useState({
  nursery_name: "Chaitanya Hi-Tech Nursery",
  phone: "",
  email: "",
  address: "",
  description: "",
  low_stock_limit: "10",
});

const [notificationSettings, setNotificationSettings] = useState({
  new_request: true,
  low_stock: true,
});
const fetchSettings = async () => {
  try {
    const token = getToken();

    if (!token) return;

    const response = await fetch(`${API_URL}/api/settings`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch settings"
      );
    }

    const settings = data.settings;

    setNurserySettings({
      nursery_name: settings.nursery_name || "",
      phone: settings.phone || "",
      email: settings.email || "",
      address: settings.address || "",
      description: settings.description || "",
      low_stock_limit: String(
        settings.low_stock_limit ?? 10
      ),
    });

    setNotificationSettings({
      new_request:
        settings.notify_new_request ?? true,
      low_stock:
        settings.notify_low_stock ?? true,
    });

  } catch (error) {
    console.error("Fetch settings error:", error);
  }
};

  const pendingRequests = requests.filter(
  (request) => request.status === "PENDING"
);
  const fetchOrders =async() => {
  try {
    setLoadingOrders(true);
    setOrderError("");

    const token = getToken();

    if (!token) {
      setOrders([]);
      setOrderError("Admin login token not found.");
      return;
    }

    const response = await fetch(
      `${API_URL}/api/orders`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log(
      "Orders status:",
      response.status
    );

    console.log(
      "Orders data:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
        `Failed to fetch orders (${response.status})`
      );
    }

    setOrders(
      Array.isArray(data)
        ? data
        : data.orders || []
    );

  } catch (error) {
    console.error(
      "Fetch orders error:",
      error
    );

    setOrders([]);

    setOrderError(
      error instanceof Error
        ? error.message
        : "Failed to fetch orders"
    );

  } finally {
    setLoadingOrders(false);
  }
};
const handleRequestDecision = async (
  requestId: number,
  status: "APPROVED" | "REJECTED"
) => {
  try {
    const token = getToken();

    if (!token) {
      alert("Admin token not found. Please login again.");
      return;
    }


    const response = await fetch(
      `${API_URL}/api/requests/${requestId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to process request"
      );
    }

    alert(data.message);

    // Refresh pending notifications
    await fetchRequests();

    // If approved, a new order may have been created
    await fetchOrders();

    // Stock/inventory may also have changed
    await fetchProducts();
    await fetchInventory();

  } catch (error) {
    console.error("Request decision error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to process request"
    );
  }
};

  /* =========================================================
     GET JWT TOKEN
  ========================================================= */

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  /* =========================================================
     FETCH PRODUCTS
  ========================================================= */

const fetchProducts = async () => {
  try {
    setLoadingProducts(true);
    setProductError("");

    const url = `${API_URL}/api/products`;

    console.log("Fetching products from:", url);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    console.log("Products response status:", response.status);

    const data = await response.json();

    console.log("Products response data:", data);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch products"
      );
    }

    // Your backend returns an array directly
    const productData = Array.isArray(data)
      ? data
      : data.products || [];

    setProducts(productData);

  } catch (error) {
    console.error("Fetch products error:", error);

    setProductError(
      error instanceof Error
        ? error.message
        : "Failed to fetch products"
    );

    setProducts([]);
    setProductError(
      error instanceof Error
        ? error.message
        : "Failed to fetch products"
    );

  } finally {
    setLoadingProducts(false);
  }
};
  /* =========================================================
     FETCH USERS
  ========================================================= */

 const fetchUsers = async () => {
  try {
    setLoadingUsers(true);
    setUserError("");

    const token = getToken();

    if (!token) {
      setUser([]);
      setUserError("Admin login token not found.");
      return;
    }

    const response = await fetch(`${API_URL}/api/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    console.log("Users response:", response.status, data);

    if (!response.ok) {
      throw new Error(
        data.message || `Failed to fetch users (${response.status})`
      );
    }

    const userData = Array.isArray(data)
      ? data
      : data.users || [];

    setUser(userData);

  } catch (error) {
    console.error("Fetch users error:", error);

    setUser([]);

    setUserError(
      error instanceof Error
        ? error.message
        : "Failed to fetch users"
    );
  } finally {
    setLoadingUsers(false);
  }
};
  /* =========================================================
     FETCH ORDERS
  ========================================================= */
const fetchRequests = async () => {
  try {
    setLoadingRequests(true);

    const token = getToken();

    if (!token) {
      setRequests([]);
      return;
    }

    const response = await fetch(`${API_URL}/api/requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();

    console.log("Requests response:", response.status, data);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch requests"
      );
    }

    setRequests(data.requests || []);

  } catch (error) {
    console.error("Fetch requests error:", error);
    setRequests([]);
  } finally {
    setLoadingRequests(false);
  }
};
  const fetchOrder = async () => {
    try {
      setLoadingOrders(true);

      const token = getToken();

      if (!token) {
        setOrder([]);
        return;
      }

      /*
        Change this endpoint if your order route
        is different.
      */

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      const orderData = Array.isArray(data)
        ? data
        : data.orders || [];

      const formattedOrders: Order[] =
        orderData.map((order: any) => ({
          id: order.id,
          customer:
            order.customer_name ||
            order.customer ||
            "Customer",
          amount: Number(
            order.total_amount ||
              order.amount ||
              0
          ),
          status: order.status,
          date: order.created_at
            ? new Date(
                order.created_at
              ).toLocaleDateString()
            : "-",
        }));

      setOrder(formattedOrders);
    } catch (error) {
      console.error("Fetch orders error:", error);

      setOrder([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  /* =========================================================
     LOAD DATA WHEN ADMIN PAGE OPENS
  ========================================================= */

  useEffect(() => {
    fetchProducts();
    fetchUsers();
    fetchOrders();
    fetchInventory();
    fetchRequests();
    fetchSettings();

  }, []);

  /* =========================================================
     OPEN ADD PRODUCT FORM
  ========================================================= */

  const openAddProductForm = () => {
    setEditingProductId(null);

    setNewProduct({
      name: "",
      category_id: "",
      description: "",
      price: "",
      unit: "piece",
      stock_quantity: "",
    });

    setShowProductForm(true);
  };

  /* =========================================================
     OPEN EDIT PRODUCT FORM
  ========================================================= */

  const openEditProductForm = (
    product: Product
  ) => {
    setEditingProductId(product.id);

    setNewProduct({
      name: product.name || "",
      category_id: product.category_id
        ? String(product.category_id)
        : "",
      description: product.description || "",
      price:
        product.price !== undefined
          ? String(product.price)
          : "",
      unit: product.unit || "piece",
      stock_quantity:
        product.stock_quantity !== undefined
          ? String(product.stock_quantity)
          : "",
    });

    setShowProductForm(true);
  };

  /* =========================================================
     SAVE PRODUCT
     ADD OR EDIT
  ========================================================= */

const saveProduct = async () => {
  // =========================
  // VALIDATION
  // =========================

  if (!newProduct.name.trim()) {
    alert("Please enter product name.");
    return;
  }

  if (!newProduct.category_id) {
    alert("Please enter/select a category.");
    return;
  }

  if (!newProduct.price) {
    alert("Please enter product price.");
    return;
  }

  if (!newProduct.stock_quantity) {
    alert("Please enter stock quantity.");
    return;
  }

  try {
    setSavingProduct(true);

    const token = getToken();

    if (!token) {
      alert("Admin login token not found. Please login again.");
      return;
    }

    const productData = {
      name: newProduct.name.trim(),
      description: newProduct.description?.trim() || null,
      price: Number(newProduct.price),
      unit: newProduct.unit || "sapling",
      category_id: Number(newProduct.category_id),
      stock_quantity: Number(newProduct.stock_quantity),
    };

    let response;

    // =========================
    // EDIT PRODUCT
    // =========================
    if (editingProductId !== null) {
      response = await fetch(
        `${API_URL}/api/products/${editingProductId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );
    }

    // =========================
    // ADD NEW PRODUCT
    // =========================
    else {
      response = await fetch(
        `${API_URL}/api/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        }
      );
    }

    const data = await response.json();

    console.log("Product save response:", data);

    if (!response.ok) {
      throw new Error(
        data.message ||
          (editingProductId !== null
            ? "Failed to update product."
            : "Failed to add product.")
      );
    }

    alert(
      editingProductId !== null
        ? "Product updated successfully 🌱"
        : "Product added successfully 🌱"
    );

    // =========================
    // RESET FORM
    // =========================
    setNewProduct({
      name: "",
      category_id: "",
      price: "",
      stock_quantity: "",
      unit: "sapling",
      description: "",
    });

    setEditingProductId(null);
    setShowProductForm(false);

    // =========================
    // REFRESH DATABASE DATA
    // =========================
    await fetchProducts();
    await fetchInventory();

  } catch (error) {
    console.error("Save product error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to save product."
    );
  } finally {
    setSavingProduct(false);
  }
};
  /* =========================================================
     ACTIVATE / DEACTIVATE PRODUCT
  ========================================================= */

  const toggleProductStatus = async (
    product: Product
  ) => {
    const token = getToken();

    if (!token) {
      alert(
        "Admin authentication token not found. Please login again."
      );
      return;
    }

    const newStatus = !product.is_active;

    try {
      const response = await fetch(
        `${API_URL}/api/products/${product.id}/status`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            is_active: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update product status."
        );
      }

      alert(
        newStatus
          ? "Product activated successfully."
          : "Product deactivated successfully."
      );

      await fetchProducts();
    } catch (error: any) {
      console.error(
        "Toggle product status error:",
        error
      );

      alert(
        error.message ||
          "Unable to update product status."
      );
    }
  };

  /* =========================================================
     DELETE PRODUCT
  ========================================================= */

  const deleteProduct = async (
    product: Product
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    const token = getToken();

    if (!token) {
      alert(
        "Admin authentication token not found. Please login again."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/products/${product.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete product."
        );
      }

      alert("Product deleted successfully.");

      await fetchProducts();
    } catch (error: any) {
      console.error(
        "Delete product error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete product."
      );
    }
  };
  const fetchInventory = async () => {
  try {
    setLoadingInventory(true);

    const token = getToken();

    if (!token) {
      setInventory([]);
      return;
    }

    const response = await fetch(
      `${API_URL}/api/inventory`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log(
      "Inventory status:",
      response.status
    );

    console.log(
      "Inventory data:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Failed to fetch inventory"
      );
    }

    setInventory(
      data.inventory || []
    );

  } catch (error) {
    console.error(
      "Fetch inventory error:",
      error
    );

    setInventory([]);

  } finally {
    setLoadingInventory(false);
  }
};
  /* =========================================================
     TOGGLE USER STATUS
  ========================================================= */

  const toggleUserStatus = async (
    user: User
  ) => {
    const token = getToken();

    if (!token) {
      alert(
        "Admin authentication token not found."
      );
      return;
    }

    /*
      If you already have a user status endpoint,
      connect it here.

      For now this updates the UI.
    */

    setUser((currentUsers) =>
      currentUsers.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status:
                item.status === "Active"
                  ? "Blocked"
                  : "Active",
            }
          : item
      )
    );
  };

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const renderDashboard = () => {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Welcome back. Manage your nursery
            business from here.
          </p>
        </div>

        {/* STATISTICS */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Customers"
            value={
              loadingUsers
                ? "..."
                :users.filter(
                (user)=> user.role === "CUSTOMER"
                ).length.toString()
            }
            subtitle="Registered customers"
            icon="👥"
          />

          <StatCard
            title="Total Products"
            value={
              loadingProducts
                ? "..."
                : products.length.toString()
            }
            subtitle="Products in database"
            icon="🌱"
          />

          <StatCard
            title="Active Products"
            value={
              loadingProducts
                ? "..."
                : products.filter(
                      (product) =>
                        product.is_active === true).length.toString()
                    
            }
            subtitle="Visible on website"
            icon="🌿"
          />

          <StatCard
            title="Total Orders"
            value={
              loadingOrders
                ? "..."
                : orders.length.toString()
            }
            subtitle="Customer orders"
            icon="📦"
          />
        </div>

        {/* DASHBOARD CONTENT */}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* RECENT ORDERS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              Recent Orders
            </h2>

            {loadingOrders ? (
              <p className="mt-5 text-slate-500">
                Loading orders...
              </p>
            ) : orders.length === 0 ? (
              <p className="mt-5 text-slate-500">
                No orders found.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {orders
                  .slice(0, 4)
                  .map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          #{order.id}
                        </p>

                        <p className="text-sm text-slate-500">
                          {order.customer_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-800">
                          ₹{order.total_amount}
                        </p>

                        <StatusBadge
                          status={order.status}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* INVENTORY */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-800">
              Inventory Overview
            </h2>

            {loadingProducts ? (
              <p className="mt-5 text-slate-500">
                Loading inventory...
              </p>
            ) : products.length === 0 ? (
              <p className="mt-5 text-slate-500">
                No products found.
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                {products
                  .filter(
                    (product) =>
                      product.is_active
                  )
                  .map((product) => {
                    const percentage =
                      Math.min(
                        product.stock_quantity *
                          2.5,
                        100
                      );

                    return (
                      <div
                        key={product.id}
                      >
                        <div className="mb-2 flex justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {product.name}
                          </span>

                          <span className="text-sm text-slate-500">
                            {
                              product.stock_quantity
                            }{" "}
                            units
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-green-600"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* =========================================================
     CUSTOMERS
  ========================================================= */

  const renderUsers = () => {
    return (
      <div>
        <PageHeader
          title="Customers"
          description="View and manage registered customers."
        />

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingUsers ? (
            <div className="p-8 text-center text-slate-500">
              Loading customers...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No customers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>
                      ID
                    </TableHeading>

                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Email
                    </TableHeading>

                    <TableHeading>
                      Phone
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <TableCell>
                        #{user.id}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-slate-800">
                          {user.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {user.role}
                        </div>
                      </TableCell>

                      <TableCell>
                        {user.email}
                      </TableCell>

                      <TableCell>
                        {user.phone}
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          status={
                            user.status
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <button
                          onClick={() =>
                            toggleUserStatus(
                              user
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {user.status ===
                          "Active"
                            ? "Block"
                            : "Unblock"}
                        </button>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* =========================================================
     PRODUCTS
  ========================================================= */

  const renderProducts = () => {
    return (
      <div>
        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <PageHeader
            title="Products"
            description="Manage nursery plants, prices and inventory."
          />

          <button
            onClick={
              openAddProductForm
            }
            className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-green-800"
          >
            + Add Product
          </button>
        </div>

        {/* ERROR */}

        {productError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {productError}

            <button
              onClick={fetchProducts}
              className="ml-3 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ADD / EDIT FORM */}

        {showProductForm && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h2 className="mb-5 text-xl font-semibold text-slate-800">
              {editingProductId !==
              null
                ? "Edit Product"
                : "Add New Product"}
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Plant Name *
                </label>

                <input
                  type="text"
                  placeholder="e.g. Mango Sapling"
                  value={
                    newProduct.name
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              {/* CATEGORY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category ID
                </label>

                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={
                    newProduct.category_id
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      category_id:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                />

                <p className="mt-1 text-xs text-slate-500">
                  Enter the category ID from your categories table.
                </p>
              </div>

              {/* PRICE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Price (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 299"
                  value={
                    newProduct.price
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              {/* STOCK */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Stock Quantity *
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 25"
                  value={
                    newProduct.stock_quantity
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock_quantity:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                />
              </div>

              {/* UNIT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Unit
                </label>

                <select
                  value={
                    newProduct.unit
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      unit: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                >
                  <option value="piece">
                    Piece
                  </option>

                  <option value="plant">
                    Plant
                  </option>

                  <option value="sapling">
                    Sapling
                  </option>
                </select>
              </div>

              {/* DESCRIPTION */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  rows={4}
                  placeholder="Enter plant description..."
                  value={
                    newProduct.description
                  }
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description:
                        e.target.value,
                    })
                  }
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600"
                />
              </div>
            </div>

            {/* FORM BUTTONS */}

            <div className="mt-5 flex gap-3">
              <button
                onClick={saveProduct}
                disabled={
                  savingProduct
                }
                className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingProduct
                  ? "Saving..."
                  : editingProductId !==
                      null
                    ? "Update Product"
                    : "Save Product"}
              </button>

              <button
                onClick={() => {
                  setShowProductForm(
                    false
                  );
                  setEditingProductId(
                    null
                  );
                }}
                disabled={
                  savingProduct
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PRODUCTS TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingProducts ? (
            <div className="p-10 text-center">
              <div className="text-4xl">
                🌱
              </div>

              <p className="mt-3 text-slate-500">
                Loading products from PostgreSQL...
              </p>
            </div>
          ) : products.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl">
                🌱
              </div>

              <h3 className="mt-4 text-xl font-semibold text-slate-800">
                No products found
              </h3>

              <p className="mt-2 text-slate-500">
                Add your first plant from the button above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>
                      ID
                    </TableHeading>

                    <TableHeading>
                      Plant
                    </TableHeading>

                    <TableHeading>
                      Category
                    </TableHeading>

                    <TableHeading>
                      Description
                    </TableHeading>

                    <TableHeading>
                      Price
                    </TableHeading>

                    <TableHeading>
                      Stock
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {products.map(
                    (product) => (
                      <tr
                        key={
                          product.id
                        }
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        {/* ID */}

                        <TableCell>
                          #
                          {
                            product.id
                          }
                        </TableCell>

                        {/* NAME */}

                        <TableCell>
                          <div className="font-semibold text-slate-800">
                            {
                              product.name
                            }
                          </div>

                          <div className="text-xs text-slate-500">
                            {
                              product.unit
                            }
                          </div>
                        </TableCell>

                        {/* CATEGORY */}

                        <TableCell>
                          {product.category_name ||
                            product.category ||
                            product.category_id ||
                            "-"}
                        </TableCell>

                        {/* DESCRIPTION */}

                        <TableCell>
                          <div className="max-w-[220px] truncate">
                            {product.description ||
                              "No description"}
                          </div>
                        </TableCell>

                        {/* PRICE */}

                        <TableCell>
                          <span className="font-semibold text-slate-800">
                            ₹
                            {
                              product.price
                            }
                          </span>
                        </TableCell>

                        {/* STOCK */}

                        <TableCell>
                          <span
                            className={
                              product.stock_quantity ===
                              0
                                ? "font-semibold text-red-600"
                                : "font-medium text-slate-700"
                            }
                          >
                            {
                              product.stock_quantity
                            }
                          </span>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          <StatusBadge
                            status={
                              product.is_active
                                ? product.stock_quantity >
                                  0
                                  ? "Available"
                                  : "Out of Stock"
                                : "Inactive"
                            }
                          />
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {/* EDIT */}

                            <button
                              onClick={() =>
                                openEditProductForm(
                                  product
                                )
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                            >
                              Edit
                            </button>

                            {/* ACTIVATE / DEACTIVATE */}

                            <button
                              onClick={() =>
                                toggleProductStatus(
                                  product
                                )
                              }
                              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                product.is_active
                                  ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                            >
                              {product.is_active
                                ? "Deactivate"
                                : "Activate"}
                            </button>

                            {/* DELETE */}

                            <button
                              onClick={() =>
                                deleteProduct(
                                  product
                                )
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* =========================================================
     ORDERS
  ========================================================= */

  const renderOrders = () => {
    return (
      <div>
        <PageHeader
          title="Orders"
          description="View customer orders."
        />

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loadingOrders ? (
            <div className="p-8 text-center text-slate-500">
              Loading orders...
            </div>
          ) : orders.length ===
            0 ? (
            <div className="p-8 text-center text-slate-500">
              No orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>
                      Order ID
                    </TableHeading>

                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Amount
                    </TableHeading>

                    <TableHeading>
                      Date
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>
                  </tr>
                </thead>

                <tbody>
                  {orders.map(
                    (order) => (
                      <tr
                        key={
                          order.id
                        }
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <TableCell>
                          <span className="font-semibold text-slate-800">
                            #
                            {
                              order.id
                            }
                          </span>
                        </TableCell>

                        <TableCell>
                          {
                            order.customer_id
                          }
                        </TableCell>

                        <TableCell>
                          ₹
                          {
                            order.total_amount
                          }
                        </TableCell>

                        <TableCell>
                          {
                            order.created_at
                          }
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={
                              order.status
                            }
                          />
                        </TableCell>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* =========================================================
     CONTENT ROUTING
  ========================================================= */

  const renderContent = () => {
    switch (activePage) {
      case "Customers":
        return renderUsers();

      case "Products":
        return renderProducts();

      case "Orders":
        return renderOrders();

      case "Settings":
      return renderSettings();

      case "Dashboard":
      default:
        return renderDashboard();
    }
  };
const renderSettings = () => {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage nursery information, notifications and admin preferences."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Nursery Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">
            Nursery Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update business information shown on the customer website.
          </p>

          <div className="mt-6 space-y-4">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nursery Name
              </label>

              <input
                type="text"
                value={nurserySettings.nursery_name}
                onChange={(e) =>
                  setNurserySettings({
                    ...nurserySettings,
                    nursery_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone Number
              </label>

              <input
                type="text"
                placeholder="Enter nursery phone number"
                value={nurserySettings.phone}
                onChange={(e) =>
                  setNurserySettings({
                    ...nurserySettings,
                    phone: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>

              <input
                type="email"
                placeholder="Enter nursery email"
                value={nurserySettings.email}
                onChange={(e) =>
                  setNurserySettings({
                    ...nurserySettings,
                    email: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Address
              </label>

              <textarea
                rows={3}
                placeholder="Enter nursery address"
                value={nurserySettings.address}
                onChange={(e) =>
                  setNurserySettings({
                    ...nurserySettings,
                    address: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                rows={4}
                placeholder="Write a short description about your nursery"
                value={nurserySettings.description}
                onChange={(e) =>
                  setNurserySettings({
                    ...nurserySettings,
                    description: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />
            </div>

            <button
              onClick={() => {
                console.log("Nursery settings:", nurserySettings);
                alert("Settings saved successfully 🌱");
              }}
              className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white hover:bg-green-800"
            >
              Save Nursery Information
            </button>

          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-6">

          {/* Admin Account */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Admin Account
            </h2>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-700">
                A
              </div>

              <div>
                <p className="font-semibold text-slate-800">
                  Nursery Admin
                </p>

                <p className="text-sm text-slate-500">
                  admin@nursery.com
                </p>

                <p className="mt-1 text-xs font-medium text-green-600">
                  ADMIN
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                alert("Change password feature will be connected next.")
              }
              className="mt-5 w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Change Password
            </button>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Notifications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose which alerts should appear in the admin portal.
            </p>

            <div className="mt-5 space-y-4">

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-800">
                    New Customer Requests
                  </p>

                  <p className="text-sm text-slate-500">
                    Show alerts when customers request plants.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notificationSettings.new_request}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      new_request: e.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-green-700"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-medium text-slate-800">
                    Low Stock Alerts
                  </p>

                  <p className="text-sm text-slate-500">
                    Get warnings when plant stock becomes low.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notificationSettings.low_stock}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      low_stock: e.target.checked,
                    })
                  }
                  className="h-5 w-5 accent-green-700"
                />
              </label>

            </div>
          </div>

          {/* Stock Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Stock Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define when a plant should be considered low stock.
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Low Stock Limit
              </label>

              <input
                type="number"
                min="0"
                value={nurserySettings.low_stock_limit}
                onChange={(e) =>
                  setNurserySettings({
                    ...nurserySettings,
                    low_stock_limit: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-green-600"
              />

              <p className="mt-2 text-xs text-slate-500">
                Example: if the limit is 10, products with fewer than 10 units can be marked Low Stock.
              </p>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800">
              Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your admin session.
            </p>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/admin/login";
              }}
              className="mt-5 w-full rounded-xl bg-red-50 py-3 font-semibold text-red-600 hover:bg-red-100"
            >
              Logout
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
const saveNurserySettings = async () => {
  try {
    const token = getToken();

    if (!token) {
      alert("Admin login required.");
      return;
    }

    const response = await fetch(`${API_URL}/api/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        nursery_name: nurserySettings.nursery_name,
        phone: nurserySettings.phone,
        email: nurserySettings.email,
        address: nurserySettings.address,
        description: nurserySettings.description,
        low_stock_limit: Number(
          nurserySettings.low_stock_limit
        ),
        notify_new_request:
          notificationSettings.new_request,
        notify_low_stock:
          notificationSettings.low_stock,
      }),
    });

    const data = await response.json();

    console.log("SAVE SETTINGS RESPONSE:", data);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to save settings"
      );
    }

    alert("Nursery information saved successfully 🌱");

    await fetchSettings();

  } catch (error) {
    console.error("Save settings error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to save settings"
    );
  }
};
  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="hidden w-64 flex-shrink-0 bg-slate-900 text-white md:block">
          <div className="sticky top-0 flex h-screen flex-col">
            {/* LOGO */}

            <div className="border-b border-slate-800 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-2xl">
                  🌱
                </div>

                <div>
                  <h2 className="font-bold">
                    Chaitanya
                  </h2>

                  <p className="text-xs text-slate-400">
                    Nursery Management
                  </p>
                </div>
              </div>
            </div>

            {/* NAVIGATION */}

            <nav className="flex-1 px-4 py-6">
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Management
              </p>

              <SidebarButton
                label="Dashboard"
                icon="📊"
                active={
                  activePage ===
                  "Dashboard"
                }
                onClick={() =>
                  setActivePage(
                    "Dashboard"
                  )
                }
              />

              <SidebarButton
                label="Customers"
                icon="👥"
                active={
                  activePage ===
                  "Customers"
                }
                onClick={() =>
                  setActivePage(
                    "Customers"
                  )
                }
              />

              <SidebarButton
                label="Products"
                icon="🌿"
                active={
                  activePage ===
                  "Products"
                }
                onClick={() =>
                  setActivePage(
                    "Products"
                  )
                }
              />

              <SidebarButton
                label="Orders"
                icon="📦"
                active={
                  activePage ===
                  "Orders"
                }
                onClick={() =>
                  setActivePage(
                    "Orders"
                  )
                }
              />

              

              

              <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                System
              </p>

              <SidebarButton
                label="Settings"
                icon="⚙️"
                active={
                  activePage ===
                  "Settings"
                }
                onClick={() =>
                  setActivePage(
                    "Settings"
                  )
                }
              />
            </nav>

            {/* ADMIN PROFILE */}

            <div className="border-t border-slate-800 p-4">
              <div className="rounded-xl bg-slate-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 font-bold">
                    A
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Administrator
                    </p>

                    <p className="text-xs text-slate-400">
                      Admin Portal
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* =====================================================
            MAIN AREA
        ===================================================== */}

        <main className="min-w-0 flex-1">
          {/* TOP BAR */}

          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
            <div className="flex h-20 items-center justify-between px-5 sm:px-8">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Admin Portal
                </h2>

                <p className="text-sm text-slate-500">
                  Manage your nursery business
                </p>
              </div>

              <div className="relative">
  <button
    onClick={() => setShowNotifications(!showNotifications)}
    className="relative rounded-xl border border-slate-200 bg-white p-3 hover:bg-slate-50"
  >
    🔔

    {pendingRequests.length > 0 && (
      <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
        {pendingRequests.length}
      </span>
    )}
  </button>

  {showNotifications && (
    <div className="absolute right-0 top-14 z-50 w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">
          Customer Requests
        </h3>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          {pendingRequests.length} Pending
        </span>
      </div>

      {loadingRequests ? (
        <p className="py-5 text-center text-sm text-slate-500">
          Loading requests...
        </p>
      ) : pendingRequests.length === 0 ? (
        <p className="py-5 text-center text-sm text-slate-500">
          No pending requests.
        </p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="font-semibold text-slate-900">
                {request.customer_name}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {request.product_name}
              </p>

              <p className="text-sm text-slate-500">
                Quantity: {request.quantity}
              </p>

              <p className="text-sm text-slate-500">
                ₹{Number(request.price).toFixed(2)}

              </p>
              <div className="mt-4 flex gap-2">

  <button
    onClick={() =>
      handleRequestDecision(
        request.id,
        "APPROVED"
      )
    }
    className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
  >
    Accept
  </button>

  <button
    onClick={() =>
      handleRequestDecision(
        request.id,
        "REJECTED"
      )
    }
    className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
  >
    Reject
  </button>

</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
</div>

                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    Administrator
                  </p>

                  <p className="text-xs text-slate-500">
                    Super Admin
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                  A
                </div>
              </div>
            

            {/* MOBILE NAVIGATION */}

            <div className="overflow-x-auto border-t border-slate-100 px-4 py-3 md:hidden">
              <div className="flex gap-2">
                {[
                  "Dashboard",
                  "Customers",
                  "Products",
                  "Orders",
                ].map((item) => (
                  <button
                    key={item}
                    onClick={() =>
                      setActivePage(
                        item
                      )
                    }
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ${
                      activePage ===
                      item
                        ? "bg-green-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}

          <div className="p-5 sm:p-8">
            {renderContent()}
          </div>

          {/* FOOTER */}

          <footer className="border-t border-slate-200 bg-white px-6 py-5 text-center text-sm text-slate-500">
            ©{" "}
            {new Date().getFullYear()}{" "}
            Chaitanya Hi-Tech Nursery —
            Admin Portal
          </footer>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {value}
          </p>

          <p className="mt-2 text-sm text-green-600">
            {subtitle}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800">
        {title}
      </h1>

      <p className="mt-2 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   SIDEBAR BUTTON
========================================================= */

function SidebarButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-green-700 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span>{icon}</span>

      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let classes =
    "bg-slate-100 text-slate-700";

  if (
    status === "Active" ||
    status === "Available" ||
    status === "Delivered"
  ) {
    classes =
      "bg-green-100 text-green-700";
  }

  if (
    status === "Blocked" ||
    status === "Cancelled" ||
    status === "Inactive"
  ) {
    classes =
      "bg-red-100 text-red-700";
  }

  if (
    status === "Processing" ||
    status === "Pending"
  ) {
    classes =
      "bg-yellow-100 text-yellow-700";
  }

  if (status === "Out of Stock") {
    classes =
      "bg-orange-100 text-orange-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   TABLE HEADING
========================================================= */

function TableHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </th>
  );
}

/* =========================================================
   TABLE CELL
========================================================= */

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-5 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}