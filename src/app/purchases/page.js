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

export default function Home() {
  const [search, setSearch] = useState("");
  const [purchasesData, setPurchasesData] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  useEffect(() => {
    async function fetchPurchases() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/purchase");
        setPurchasesData(response.data);
      } catch (err) {
        console.error("Error fetching Purchases", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchPurchases();
  }, []);

  const filteredpurchases = purchasesData.filter((p) => {
    const monthYear = new Date(p.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    }); // e.g., "July 2025"

    return (
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.date.includes(search) ||
      monthYear.toLowerCase().includes(search.toLowerCase())
    );
  });

  function groupPurchasesByMonthAndDay(purchases) {
    const grouped = {};

    purchases &&
      purchases.forEach((purchase) => {
        const date = new Date(purchase.createdAt);
        const monthKey = date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        }); // e.g., "July 2025"

        const dayKey = date.toLocaleDateString(); // e.g., "7/29/2025" or "29/07/2025"

        if (!grouped[monthKey]) grouped[monthKey] = {};
        if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];

        grouped[monthKey][dayKey].push(purchase);
      });

    return grouped;
  }

  const groupedpurchases = groupPurchasesByMonthAndDay(filteredpurchases);
  const paymentSummary = {};

  purchasesData.length > 0 &&
    purchasesData.forEach((purchase) => {
      purchase.paidWith?.length > 0 &&
        purchase.paidWith?.forEach((payment) => {
          const method = payment.method;
          const amount = Number(payment.amount);

          if (paymentSummary[method]) {
            paymentSummary[method] += amount;
          } else {
            paymentSummary[method] = amount;
          }
        });
    });

  const total = Object.values(paymentSummary).reduce(
    (acc, val) => acc + val,
    0
  );

  return (
    <div className={`${styles.purchaseContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage purchases</h1>

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
      {Object.entries(groupedpurchases).map(([month, days]) => (
        <div key={month} className={styles.purchasesTable}>
          <h1 className={styles.pageTitle}>Purchase - {month}</h1>

          {Object.entries(days).map(([day, dayPurchases]) => (
            <div key={day} style={{ marginBottom: "30px" }}>
              <h3
                style={{
                  margin: "10px 5px",
                  fontSize: 14,
                }}
              >
                {day} — Total:{" "}
                {dayPurchases
                  .reduce((acc, p) => acc + p.quantity * p.purchasingPrice, 0)
                  .toLocaleString()}{" "}
                ETB
              </h3>

              <div className={styles.tableContainer}>
                <table className={styles.productTable}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Purchasing Price</th>
                      {/* <th>Selling Price</th> */}
                      <th>Quantity</th>
                      <th>Supplier Name</th>
                      <th>Supplier Phone</th>
                      <th>Paid With</th>
                      <th>Payment Status</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>{purchase.productName || "--"}</td>
                        <td>
                          {purchase.purchasingPrice?.toLocaleString()} ETB
                        </td>
                        {/* <td>{purchase.sellingPrice?.toLocaleString()} ETB</td> */}
                        <td>{purchase.quantity?.toLocaleString()}</td>
                        <td>{purchase.supplierName || "--"}</td>
                        <td>{purchase.supplierPhone || "--"}</td>

                        <td style={{ width: 250 }}>
                          {Array.isArray(purchase.paidWith) ? (
                            purchase.paidWith.map((p, i) => (
                              <div key={i}>
                                {purchase.paymentStatus === "paid" ||
                                purchase.paymentStatus === "partial" ? (
                                  <>
                                    <div style={{ paddingBottom: 10 }}>
                                      <strong>
                                        {String(p.method) || "Unknown"}:
                                      </strong>{" "}
                                      {Number(p.amount || 0).toLocaleString()}{" "}
                                      ETB
                                    </div>
                                    <hr
                                      style={{
                                        marginTop: 8,
                                        color: "rgba(112, 112, 112, 0.5)",
                                      }}
                                    />
                                  </>
                                ) : (
                                  <>--</>
                                )}
                              </div>
                            ))
                          ) : (
                            <span>--</span>
                          )}
                        </td>

                        <td
                          style={{
                            color:
                              purchase.paymentStatus === "credit" ||
                              purchase.paymentStatus === "partial"
                                ? "red"
                                : "black",
                          }}
                        >
                          {purchase.paymentStatus || "--"}
                        </td>
                        <td>
                          {(
                            purchase.quantity * purchase.purchasingPrice
                          ).toLocaleString()}{" "}
                          ETB
                        </td>
                        <td>{new Date(purchase.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}{" "}
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
