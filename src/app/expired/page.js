"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { MdWarningAmber } from "react-icons/md";
import axios from "axios";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function ExpiredAlert() {
  const [search, setSearch] = useState("");
  const [expired, setExpired] = useState([]);
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [viewMode, setViewMode] = useState("expiring");
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingPage(true);
        const response = await axios.get("/api/auth/products/expiry");
        setExpired(response.data.expired);
        setExpiringSoon(response.data.expiringSoon);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchProducts();
  }, []);

  const expiredFiltered = expired.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );
  const expiringFiltered = expiringSoon.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );
  const displayedData =
    viewMode === "expired" ? expiredFiltered : expiringFiltered;

  return (
    <div className={`${styles.lowStockContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>
          <MdWarningAmber />{" "}
          {viewMode === "expiring" ? "1 month left for expiring" : "Expired"}
        </h1>

        <div className={styles.topBar}>
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>{" "}
      <div className={`${styles.viewToggle} ${jura.className}`}>
        <button
          className={`${styles.toggleBtn} ${
            viewMode === "expiring" ? styles.active : ""
          }`}
          onClick={() => setViewMode("expiring")}
        >
          Expiring Soon
        </button>
        <button
          className={`${styles.toggleBtn} ${
            viewMode === "expired" ? styles.active : ""
          }`}
          onClick={() => setViewMode("expired")}
        >
          Expired
        </button>
      </div>
      {expiringSoon.length === 0 && viewMode === "expiring" && !loadingPage && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "26px",
            color: "#555",
          }}
        >
          No product is expiring soon.
        </div>
      )}
      {expiringSoon.length > 0 && viewMode === "expiring" && (
        <div className={styles.overStocksTable}>
          <div className={styles.tableContainer}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>In shop 235</th>
                  <th>In Shop 116</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.map((product) => (
                  <tr key={product.id}>
                    <td>{product.productName}</td>
                    <td>{product.inShop.toLocaleString()}</td>
                    <td>{product.inStore.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}{" "}
      {expired.length === 0 && viewMode === "expired" && !loadingPage && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "26px",
            color: "#555",
          }}
        >
          No product is expired.
        </div>
      )}{" "}
      {expired.length > 0 && viewMode === "expired" && (
        <div className={styles.overStocksTable}>
          <div className={styles.tableContainer}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>In shop 235</th>
                  <th>In Shop 116</th>
                </tr>
              </thead>
              <tbody>
                {displayedData.map((product) => (
                  <tr key={product.id}>
                    <td>{product.productName}</td>
                    <td>{product.inShop.toLocaleString()}</td>
                    <td>{product.inStore.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}{" "}
      {loadingPage && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(255,255,255,0.6)",
            zIndex: 2000,
          }}
        >
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}
