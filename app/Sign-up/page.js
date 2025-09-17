"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Use local backend URL here; change to your deployed backend when ready
  const backendUrl = "https://aufondue-backend.kindisland-399ef298.southeastasia.azurecontainerapps.io/api";

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Check if the user is invited and allowed to sign up
      const res = await fetch(`${backendUrl}/admin/check?email=${email}`);
      if (!res.ok) {
        throw new Error("Failed to check invitation status");
      }
      const status = await res.text();

      if (status !== "can_signup") {
        alert("You are not allowed to sign up.");
        return;
      }

      // Step 2: Create the Firebase user with email and password
      await createUserWithEmailAndPassword(auth, email, password);

      // Step 3: Notify backend to update registered status and username
      const registerRes = await fetch(`${backendUrl}/admin/register`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username: fullName }),
        credentials: "include", 
      });

      if (!registerRes.ok) {
        throw new Error("Failed to update registration status on backend");
      }

      alert("Account created successfully! Please log in.");
      router.push("/Log-in");

    } catch (error) {
      console.error("Signup failed:", error);
      alert("Signup failed: " + error.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-blue-100">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>

        <label className="block mb-2">Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />

        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />

        <label className="block mb-2">Password</label>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
          required
        />

        <div className="mb-4 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword((prev) => !prev)}
            />
            Show Password
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Create Account
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/Log-in" className="text-blue-500 underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}
