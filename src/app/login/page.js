"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "/api/auth/login",
        { phone, password },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (res.status === 200) {
        setTimeout(() => {
          router.push("/");
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      // Get error message from backend
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error); // e.g. "Invalid credentials"
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };
  return (
    <div className={`${styles.loginContent} ${jura.className}`}>
      <form onSubmit={handleLogin} className={styles.loginForm}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
        />
        <div style={{ textAlign: "center", fontSize: "10px", color: "red" }}>
          {error}
        </div>
        <button className={styles.editButton} type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
