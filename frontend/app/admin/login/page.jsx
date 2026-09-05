
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      // Login failed
      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      // Make sure backend returned token
      if (!data.token) {
        setError("Login failed. Token was not received.");
        setLoading(false);
        return;
      }

      // IMPORTANT:
      // Only ADMIN is allowed
      if (!data.user || data.user.role !== "ADMIN") {
        setError("Access denied. Only administrators can access this portal.");
        setLoading(false);
        return;
      }

      // Store authentication information
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Go to admin dashboard
      router.push("/admin");

    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">

          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white p-2 shadow-lg">
            <img
              src="/chaitanya-logo.png"
              alt="Chaitanya Hi-Tech Nursery"
              className="h-full w-full object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-green-800">
            Chaitanya Hi-Tech Nursery
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Administrator Portal
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white p-8 shadow-xl border border-green-100">

          <div className="mb-7">

            <h2 className="text-2xl font-bold text-gray-800">
              Admin Login
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Sign in with your administrator credentials.
            </p>

          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Admin Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

            </div>

            {/* Password */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-700 py-3.5 font-semibold text-white shadow-md transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {loading ? "Checking credentials..." : "Login to Admin Portal"}
            </button>

          </form>

          {/* Security message */}
          <div className="mt-6 rounded-xl bg-green-50 p-4">

            <p className="text-center text-xs text-green-700">
              🔒 This portal is restricted to authorized administrators only.
            </p>

          </div>

          {/* Back */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 w-full text-center text-sm font-medium text-gray-500 transition hover:text-green-700"
          >
            ← Back to Nursery Website
          </button>

        </div>

      </div>

    </main>
  );
}

