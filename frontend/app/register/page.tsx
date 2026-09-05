"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to create account.");
        return;
      }

      setSuccess("Account created successfully! Redirecting to login...");

      // Redirect to login after successful registration
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
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

            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">
                Create Account 🌱
              </h1>

              <p className="mt-2 text-slate-500">
                Join Chaitanya Hi-Tech Nursery
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleRegister} className="mt-8 space-y-5">

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>

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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{" "}

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-green-700 hover:text-green-800"
              >
                Login
              </button>
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden bg-gradient-to-br from-green-700 to-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-center">

            <div className="mb-8 text-6xl">
              🌿
            </div>

            <h2 className="text-4xl font-bold leading-tight">
              Start Growing.
              <span className="block text-green-200">
                Start Today.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-lg leading-8 text-green-50">
              Create your account and explore healthy seedlings,
              plants and nursery products from Chaitanya Hi-Tech Nursery.
            </p>

            <div className="mt-10 space-y-4">

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  ✓
                </span>
                <span>Secure account creation</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  ✓
                </span>
                <span>Easy plant and seedling requests</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                  ✓
                </span>
                <span>Manage your nursery orders</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}