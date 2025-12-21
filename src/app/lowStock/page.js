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

export default function Home() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("store");
  const [lowStock, setLowStock] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoadingPage(true);
        const response = await axios.get("/api/auth/products");
        const products = response.data;

        const stockLow = products.filter(
          (p) => p.inStore + p.inShop <= p.minStock
        );

        setLowStock(stockLow);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredStore = lowStock.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );
  const displayedData = viewMode === "store" ? filteredStore : filteredShop;

  return (
    <div className={`${styles.lowStockContent} ${jura.className}`}>
      {/* <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleBtn} ${
            viewMode === "store" ? styles.active : ""
          }`}
          onClick={() => setViewMode("store")}
        >
          Store
        </button>
        <button
          className={`${styles.toggleBtn} ${
            viewMode === "shop" ? styles.active : ""
          }`}
          onClick={() => setViewMode("shop")}
        >
          Shop
        </button>
      </div> */}
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>
          <MdWarningAmber /> Low Stock Alert
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
      </div>
      {lowStock.length === 0 && !loadingPage && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "26px",
            color: "#555",
          }}
        >
          No low stock item.
        </div>
      )}
      {lowStock.length > 0 && (
        <div className={styles.lowStocksTable}>
          <div className={styles.tableContainer}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>In shop</th>
                  <th>In store</th>
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
