"use client";

import { useRouter } from "next/navigation";


import { useEffect, useState } from "react";
import Link from "next/link";




interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  stock_quantity: number;
  is_active: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
const [userName, setUserName] = useState("");

useEffect(() => {
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);

      if (user?.name) {
        setUserName(user.name);
        setShowWelcome(true);

        const timer = setTimeout(() => {
          setShowWelcome(false);
        }, 3000);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error reading user information:", error);
    }
  }
}, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        // Your backend may return either an array
        // or an object containing products.
        const productList = Array.isArray(data)
          ? data
          : data.products || [];

        setProducts(
          productList
            .filter((product: Product) => product.is_active !== false)
            .slice(0, 4)
        );
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
  const handleRequestProduct = async (productId: number) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first.");
      return;
    }

    const response = await fetch(
      "http://localhost:5000/api/requests",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          message: "Customer requested this plant",
        }),
      }
    );

    const data = await response.json();

    console.log("Request response:", response.status, data);

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to create request"
      );
    }

    alert("Request sent successfully 🌱");

  } catch (error) {
    console.error("Request error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Failed to create request"
    );
  }
};

  return (
    <main className="min-h-screen bg-[#f7fbf7] text-slate-800">
      {showWelcome && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">

      {/* Plant Icon */}
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-5xl">
        🌱
      </div>

      {/* Greeting */}
      <h2 className="mt-6 text-3xl font-bold text-green-800">
        Hi, {userName}! 👋
      </h2>

      {/* Welcome Message */}
      <p className="mt-3 text-lg text-slate-600">
        Welcome to Chaitanya Hi-Tech Nursery
      </p>

      <p className="mt-2 text-sm text-green-700">
        🌿 Happy Growing!
      </p>

      {/* Continue Button */}
      <button
        onClick={() => setShowWelcome(false)}
        className="mt-7 rounded-xl bg-green-700 px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-green-800"
      >
        Continue
      </button>

    </div>
  </div>
)}

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-2xl">
              🌱
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-green-700 sm:text-2xl">
                CHAITANYA HI-TECH NURSERY
              </h1>

              <p className="text-xs text-slate-500">
                Healthy Seedlings • Better Farming
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="font-medium text-green-700 transition hover:text-green-900"
            >
              Home
            </Link>

            <Link
              href="/products"
              className="font-medium text-slate-700 transition hover:text-green-700"
            >
              Seedlings
            </Link>

            <Link
              href="/requests"
              className="font-medium text-slate-700 transition hover:text-green-700"
            >
              Requests
            </Link>

            <Link
              href="/orders"
              className="font-medium text-slate-700 transition hover:text-green-700"
            >
              My Orders
            </Link>

            <Link
              href="/login"
              className="rounded-lg bg-green-700 px-6 py-2.5 font-semibold text-white transition hover:bg-green-800"
            >
              Login
            </Link>
            <button
  onClick={() => router.push("/admin/login")}
  className="rounded-xl border border-green-700 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-700 hover:text-white"
>
  Admin Login
</button>
          </nav>

          {/* Mobile Login */}
          <Link
            href="/login"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white md:hidden"
          >
            Login
          </Link>
        </div>
        
      </header>


      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50">

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">

          {/* Hero Content */}
          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-sm">
              🌱 CHAITANYA HI-TECH NURSERY
            </div>

            <h2 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl">
              Fresh & Healthy{" "}
              <span className="text-green-700">
                Seedlings
              </span>
              <br />
              For Better Farming
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Quality seedlings prepared with care for healthy and productive
              farming. Explore the seedlings available at Chaitanya Hi-Tech
              Nursery.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">

              

              <Link
                href="/requests"
                className="rounded-xl border-2 border-green-700 bg-white px-7 py-3.5 text-center font-bold text-green-700 transition hover:bg-green-50"
              >
                Request Seedlings
              </Link>

            </div>

            {/* Small information */}
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">

              <div className="flex items-center gap-2">
                <span className="text-xl">🌱</span>
                Healthy Seedlings
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl">🏡</span>
                Hi-Tech Nursery
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                Bhor, Pune
              </div>

            </div>
          </div>


          {/* Hero Visual */}
          <div className="relative">

            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-green-200/50 blur-3xl" />

            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-green-100 bg-white p-4 shadow-2xl">

              {/* Temporary nursery visual */}
              <div className="flex h-[430px] items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 via-emerald-50 to-green-200">

                <div className="text-center">

                  <div className="flex items-center justify-center rounded-3xl bg-white p-6 shadow-xl">
  <img
       src="/chaitanya-logo.png"
       alt="Chaitanya Hi-Tech Nursery"
       className="w-full h-auto object-contain"
/>

                </div>

              </div>

            </div>

          </div>
        </div>
        </div>
      </section>


      {/* ================= ABOUT NURSERY ================= */}
      <section className="bg-white py-20">

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">

          {/* Visual */}
          <div className="rounded-3xl bg-green-50 p-8">

            <div className="grid grid-cols-2 gap-5">

              <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-6xl shadow-sm">
                🌱
              </div>

              <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-6xl shadow-sm">
                🌿
              </div>

              <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-6xl shadow-sm">
                🍅
              </div>

              <div className="flex h-48 items-center justify-center rounded-2xl bg-white text-6xl shadow-sm">
                🌾
              </div>

            </div>

          </div>


          {/* Content */}
          <div>

            <p className="font-semibold uppercase tracking-wider text-green-700">
              About Our Nursery
            </p>

            <h2 className="mt-3 text-4xl font-bold leading-tight text-slate-900">
              Growing Healthy Plants
              <br />
              From The Beginning
            </h2>

            <p className="mt-6 leading-8 text-slate-600">
              Chaitanya Hi-Tech Nursery provides seedlings and saplings for
              growers looking for healthy planting material. Our nursery
              focuses on preparing plants carefully so they are ready for
              farming and cultivation.
            </p>

            <p className="mt-4 leading-8 text-slate-600">
              The nursery offers different types of seedlings including
              vegetable and flowering varieties, according to availability.
            </p>

            <div className="mt-7">

              <Link
                href="/products"
                className="inline-flex items-center rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                View All Seedlings → 
              </Link>

            </div>

          </div>

        </div>

      </section>


      {/* ================= SEEDLING TYPES ================= */}
      <section className="bg-[#f7fbf7] py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <p className="font-semibold uppercase tracking-wider text-green-700">
              Our Nursery
            </p>

            <h2 className="mt-3 text-4xl font-bold text-slate-900">
              Seedlings & Saplings
            </h2>

            <p className="mt-4 text-slate-600">
              Explore the varieties available at Chaitanya Hi-Tech Nursery.
            </p>

          </div>


          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Vegetable */}
            <div className="group rounded-2xl border border-green-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-4xl transition group-hover:scale-110">
                🍅
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Vegetable Seedlings
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Seedlings suitable for vegetable cultivation.
              </p>

            </div>


            {/* Flower */}
            <div className="group rounded-2xl border border-green-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-4xl transition group-hover:scale-110">
                🌼
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Flower Seedlings
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Flowering varieties available according to nursery stock.
              </p>

            </div>


            {/* Fruit */}
            <div className="group rounded-2xl border border-green-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-4xl transition group-hover:scale-110">
                🥭
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Fruit Saplings
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Saplings for fruit cultivation, subject to availability.
              </p>

            </div>


            {/* Nursery */}
            <div className="group rounded-2xl border border-green-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-4xl transition group-hover:scale-110">
                🏡
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Nursery Plants
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Healthy plants prepared and maintained at the nursery.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURED PRODUCTS ================= */}
      <section className="bg-white py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="font-semibold uppercase tracking-wider text-green-700">
                Available Now
              </p>

              <h2 className="mt-2 text-4xl font-bold text-slate-900">
                Fresh & Healthy Seedlings
              </h2>

              <p className="mt-3 max-w-2xl text-slate-600">
                Check the currently available plants and saplings from our
                nursery.
              </p>

            </div>

            <Link
              href="/products"
              className="font-semibold text-green-700 hover:text-green-900"
            >
              View All →
            </Link>

          </div>


          {/* Loading */}
          {loading && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-96 animate-pulse rounded-2xl bg-green-50"
                />
              ))}

            </div>
          )}


          {/* Products */}
{!loading && products.length > 0 && (
  <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

    {products.map((product) => (

      <div
        key={product.id}
        className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      >

        {/* Temporary image area */}
        <div className="flex h-52 items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
          <span className="text-7xl">
            🌱
          </span>
        </div>

        <div className="p-6">

          <h3 className="text-xl font-bold text-slate-900">
            {product.name}
          </h3>

          <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">
            {product.description}
          </p>

          <div className="mt-5 flex items-end justify-between">

            <div>
              <p className="text-2xl font-bold text-green-700">
                ₹{Number(product.price).toFixed(2)}
              </p>

              <p className="text-xs text-slate-500">
                per {product.unit}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-slate-600">
                Stock
              </p>

              <p className="font-bold text-green-700">
                {product.stock_quantity}
              </p>
            </div>

          </div>

          {/* View Details */}
          <Link
            href={`/products/${product.id}`}
            className="mt-5 block rounded-xl bg-green-700 py-3 text-center font-semibold text-white transition hover:bg-green-800"
          >
            View Details
          </Link>

          {/* Request Plant */}
          <button
            onClick={() => handleRequestProduct(product.id)}
            className="mt-3 w-full rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700"
          >
            Request This Plant
          </button>

        </div>

      </div>

    ))}

  </div>
)}

          {/* No products */}
          {!loading && products.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-green-200 bg-green-50 p-12 text-center">

              <div className="text-5xl">
                🌱
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Seedlings will appear here
              </h3>

              <p className="mt-2 text-slate-600">
                Please check the available products from the nursery.
              </p>

            </div>
          )}

        </div>

      </section>


      {/* ================= WHY CHOOSE US ================= */}
      <section className="bg-green-800 py-20 text-white">

        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">

            <p className="font-semibold uppercase tracking-wider text-green-200">
              Why Chaitanya Hi-Tech Nursery
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              From Nursery To Your Farm
            </h2>

            <p className="mt-4 leading-7 text-green-100">
              We make it easier to discover available seedlings and request
              the plants you need.
            </p>

          </div>


          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-2xl bg-white/10 p-7 backdrop-blur">
              <div className="text-4xl">🌱</div>

              <h3 className="mt-5 text-xl font-bold">
                Healthy Seedlings
              </h3>

              <p className="mt-3 text-sm leading-6 text-green-100">
                Seedlings are prepared and maintained with care.
              </p>
            </div>


            <div className="rounded-2xl bg-white/10 p-7 backdrop-blur">
              <div className="text-4xl">🏡</div>

              <h3 className="mt-5 text-xl font-bold">
                Hi-Tech Nursery
              </h3>

              <p className="mt-3 text-sm leading-6 text-green-100">
                Nursery-based production of seedlings and planting material.
              </p>
            </div>


            <div className="rounded-2xl bg-white/10 p-7 backdrop-blur">
              <div className="text-4xl">🌾</div>

              <h3 className="mt-5 text-xl font-bold">
                Farming Focused
              </h3>

              <p className="mt-3 text-sm leading-6 text-green-100">
                Seedlings and saplings intended for cultivation and farming.
              </p>
            </div>


            <div className="rounded-2xl bg-white/10 p-7 backdrop-blur">
              <div className="text-4xl">📦</div>

              <h3 className="mt-5 text-xl font-bold">
                Easy Requests
              </h3>

              <p className="mt-3 text-sm leading-6 text-green-100">
                Customers can browse available plants and send requests.
              </p>
            </div>

          </div>

        </div>

      </section>


      {/* ================= LOCATION ================= */}
      <section className="bg-white py-20">

        <div className="mx-auto max-w-7xl px-6">

          <div className="grid overflow-hidden rounded-3xl bg-green-50 lg:grid-cols-2">

            {/* Location information */}
            <div className="p-8 sm:p-12">

              <p className="font-semibold uppercase tracking-wider text-green-700">
                Visit Our Nursery
              </p>

              <h2 className="mt-3 text-4xl font-bold text-slate-900">
                Chaitanya Hi-Tech Nursery
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Visit us on the Pune–Satara Highway at Khamathadi,
                Bhor, Pune.
              </p>

              <div className="mt-8 space-y-5">

                <div className="flex gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    📍
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Location
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Pune–Satara Highway,
                      Khamathadi, Bhor, Pune
                    </p>
                  </div>

                </div>


                <div className="flex gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                    🌱
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Nursery
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Chaitanya Hi-Tech Nursery
                    </p>
                  </div>

                </div>

              </div>

            </div>


            {/* Map placeholder */}
            <div className="flex min-h-[350px] items-center justify-center bg-gradient-to-br from-green-200 to-emerald-100">

              <div className="text-center">

                <div className="text-6xl">
                  📍
                </div>

                <h3 className="mt-4 text-2xl font-bold text-green-900">
                  Bhor, Pune
                </h3>

                <p className="mt-2 text-green-800">
                  Pune–Satara Highway
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-white">

        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">

          {/* Brand */}
          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-700 text-2xl">
                🌱
              </div>

              <div>
                <h3 className="font-bold">
                  CHAITANYA HI-TECH NURSERY
                </h3>

                <p className="text-xs text-slate-400">
                  Healthy Seedlings • Better Farming
                </p>
              </div>

            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Quality seedlings and saplings for growers and farmers.
              Explore available nursery plants and send your requirements
              online.
            </p>

          </div>


          {/* Quick Links */}
          <div>

            <h3 className="font-bold">
              Quick Links
            </h3>

            <div className="mt-5 space-y-3 text-sm text-slate-400">

              <Link
                href="/"
                className="block transition hover:text-white"
              >
                Home
              </Link>

              <Link
                href="/products"
                className="block transition hover:text-white"
              >
                Seedlings
              </Link>

              <Link
                href="/requests"
                className="block transition hover:text-white"
              >
                Requests
              </Link>

              <Link
                href="/orders"
                className="block transition hover:text-white"
              >
                My Orders
              </Link>

            </div>

          </div>


          {/* Contact */}
          <div>

            <h3 className="font-bold">
              Nursery Location
            </h3>

            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-400">

              <p>
                📍 Pune–Satara Highway
              </p>

              <p>
                📍 Khamathadi, Bhor, Pune
              </p>

              <p>
                🌱 Chaitanya Hi-Tech Nursery
              </p>

            </div>

          </div>

        </div>


        <div className="border-t border-white/10">

          <div className="mx-auto max-w-7xl px-6 py-5 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Chaitanya Hi-Tech Nursery. All
            rights reserved.
          </div>

        </div>

      </footer>

    </main>
  );
}
