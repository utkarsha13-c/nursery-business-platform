"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  stock_quantity: number;
  category: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        setProducts(data);
      } catch (error) {
        console.error(error);
        setError("Unable to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-green-700 text-lg">
          Loading plants... 🌱
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf5]">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white shadow-sm">
        <a
          href="/"
          className="text-2xl font-bold text-green-700"
        >
          🌱 CHAITANYA HI-TECH NURSERY
        </a>

        <div className="flex gap-8 text-sm font-medium">
          <a href="/">Home</a>

          <a
            href="/products"
            className="text-green-700"
          >
            Plants
          </a>

          <a href="/login">
            Login
          </a>
        </div>
      </nav>

      {/* Header */}
      <section className="text-center py-14 px-6">

        <p className="text-green-700 font-semibold">
          🌿 OUR COLLECTION
        </p>

        <h1 className="text-4xl font-bold mt-3 text-green-800">
          Fresh & Healthy Seedlings
        </h1>

        <p className="text-gray-600 mt-4">
          Quality seedlings prepared with care for better farming.
        </p>

      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-8 pb-20">

        {products.length === 0 ? (
          <p className="text-center text-gray-500">
            No plants available.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">

            {products.map((product) => (

              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition"
              >

                {/* Image placeholder */}
                <div className="h-48 bg-green-50 flex items-center justify-center text-7xl">
                  🌱
                </div>

                <div className="p-6">

                  
                  <h2 className="text-xl font-bold mt-2">
                    {product.name}
                  </h2>

                  <p className="text-gray-500 text-sm mt-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mt-5">

                    <div>
                      <p className="text-2xl font-bold text-green-700">
                        ₹{product.price}
                      </p>

                      <p className="text-xs text-gray-500">
                        per {product.unit}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600">
                      Stock: {product.stock_quantity}
                    </p>

                  </div>

                  <button
                    className="w-full mt-5 bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800"
                  >
                    View Details
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </section>

    </main>
  );
}