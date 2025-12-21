"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { FiPlus } from "react-icons/fi";
import { motion, AnimatePresence, rgba } from "framer-motion";
import axios from "axios";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function CustomerSupplier() {
  const [search, setSearch] = useState("");
  const [purchasesData, setPurchasesData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  useEffect(() => {
    async function fetchPurchases() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/purchase");
        setPurchasesData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchPurchases();
  }, []);
  useEffect(() => {
    async function fetchSales() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/sell");
        setSalesData(response.data);
      } catch (err) {
        console.error("Error fetching sales", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchSales();
  }, []);

  const suppliers = Object.values(
    purchasesData.reduce((acc, p) => {
      if (!p.supplierName && !p.supplierPhone) return acc;

      const key = `${p.supplierName || ""}-${p.supplierPhone || ""}`;

      if (!acc[key]) {
        acc[key] = {
          name: p.supplierName || "--",
          phone: p.supplierPhone || "--",
          date: p.createdAt,
        };
      }

      return acc;
    }, {})
  );

  const customers = Object.values(
    salesData.reduce((acc, s) => {
      if (!s.customerName && !s.customerPhone) return acc;

      const key = `${s.customerName || ""}-${s.customerPhone || ""}`;

      if (!acc[key]) {
        acc[key] = {
          name: s.customerName || "--",
          phone: s.customerPhone || "--",
          plateNo: s.plateNo || "--",
          address: s.address || "--",
          date: s.createdAt,
        };
      }

      return acc;
    }, {})
  );

  const [viewMode, setViewMode] = useState("customers");
  return (
    <div className={`${styles.purchaseContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>
          {viewMode === "customers" ? "Customers" : "Suppliers"} Management
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
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleBtn} ${
            viewMode === "customers" ? styles.active : ""
          } ${jura.className}`}
          onClick={() => setViewMode("customers")}
        >
          Customers
        </button>

        <button
          className={`${styles.toggleBtn} ${
            viewMode === "suppliers" ? styles.active : ""
          } ${jura.className}`}
          onClick={() => setViewMode("suppliers")}
        >
          Suppliers
        </button>
      </div>
      <div className={styles.tableContainer}>
        <table className={`${styles.productTable} ${jura.className} `}>
          <thead style={{ fontWeight: "800", fontSize: "17px" }}>
            <tr>
              <th>{viewMode === "customers" ? "Customer" : "Supplier"} Name</th>

              <th>Phone Number</th>
              {viewMode === "customers" && (
                <>
                  <th>Plate Number</th>
                  <th>Adress</th>
                </>
              )}
              <th>{viewMode === "customers" ? "Sales" : "Purchase"} Date</th>
            </tr>
          </thead>
          <tbody style={{ textAlign: "center" }}>
            {(viewMode === "customers" ? customers : suppliers).map(
              (product) => (
                <tr key={product.id}>
                  <td>{product.name ? product?.name : "--"}</td>
                  <td>{product.phone ? product?.phone : "--"}</td>
                  {viewMode === "customers" && (
                    <>
                      <td>{product.plateNo ? product?.plateNo : "--"}</td>
                      <td>{product.address ? product?.address : "--"}</td>
                    </>
                  )}
                  <td>{new Date(product.date).toLocaleDateString()}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>{" "}
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
