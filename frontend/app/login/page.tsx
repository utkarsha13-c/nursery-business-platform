
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user information if returned by backend
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Redirect according to role
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-6 py-12">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">

            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img
                src="/chaitanya-logo.png"
                alt="Chaitanya Hi-Tech Nursery"
                className="h-auto w-52 object-contain"
              />
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome Back 🌱
              </h1>

              <p className="mt-2 text-slate-500">
                Login to Chaitanya Hi-Tech Nursery
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="font-semibold text-green-700 hover:text-green-800"
              >
                Create Account
              </button>
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden bg-gradient-to-br from-green-700 to-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-center">

            <div className="mb-8 text-6xl">
              🌱
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Grow Better.
              <span className="block text-green-200">
                Grow Naturally.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-green-50">
              Explore healthy seedlings, plants and nursery products from
              Chaitanya Hi-Tech Nursery.
            </p>

            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  ✓
                </span>
                <span>Healthy and quality seedlings</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  ✓
                </span>
                <span>Plants for farmers and growers</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  ✓
                </span>
                <span>Easy seedling requests</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
