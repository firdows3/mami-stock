"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function StoreSales() {
  const [search, setSearch] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [role, setRole] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingPage(true);
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.authenticated) {
          setRole(data.role);
        } else {
          setRole("");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setRole("");
      } finally {
        setLoadingPage(false);
      }
    };

    fetchUser();
  }, []);
  useEffect(() => {
    async function fetchSales() {
      try {
        const response = await axios.get("/api/auth/sell");
        let storeSales = response.data.filter(
          (sales) => sales.saleSource === "shop 116"
        );
        setSalesData(storeSales);
      } catch (err) {
        console.error("Error fetching sales", err);
      }
    }

    fetchSales();
  }, []);

  const filteredSales = salesData.filter((p) => {
    const monthYear = new Date(p.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const matchesPaidWith = Array.isArray(p.paidWith)
      ? p.paidWith.some(
          (entry) =>
            typeof entry.method === "string" &&
            entry.method?.toLowerCase().includes(search.toLowerCase())
        )
      : false;

    return (
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      matchesPaidWith ||
      p.date.includes(search) ||
      monthYear.toLowerCase().includes(search.toLowerCase())
    );
  });

  function groupSalesByMonthAndDay(sales) {
    const grouped = {};

    sales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      const monthKey = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }); // e.g., "July 2025"

      const dayKey = date.toLocaleDateString(); // e.g., "7/29/2025" or "29/07/2025"

      if (!grouped[monthKey]) grouped[monthKey] = {};
      if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];

      grouped[monthKey][dayKey].push(sale);
    });

    return grouped;
  }
  // inside your component, before grouping
  const today = new Date();
  const todayStr = today.toLocaleDateString(); // e.g. "8/16/2025"

  let filteredByRole = [...filteredSales];

  if (role === "storekeeper") {
    filteredByRole = filteredByRole.filter((sale) => {
      const saleDate = new Date(sale.createdAt).toLocaleDateString();
      return saleDate === todayStr;
    });
  }

  const groupedSales = groupSalesByMonthAndDay(filteredByRole);
  const paidMethods = {};

  salesData.forEach((sale) => {
    if (Array.isArray(sale.paidWith)) {
      sale.paidWith.forEach((payment) => {
        const method =
          typeof payment.method === "string"
            ? payment.method
            : String(payment.method || "Unknown");

        const amount = Number(payment.amount) || 0;

        if (!paidMethods[method]) {
          paidMethods[method] = 0;
        }
        paidMethods[method] += amount;
      });
    }
  });

  return (
    <div className={`${styles.slaesContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage Store Sales</h1>

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
      {salesData.length === 0 && !loadingPage && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "26px",
            color: "#555",
          }}
        >
          No sales yet
        </div>
      )}
      {Object.entries(groupedSales).map(([month, days]) => (
        <div key={month} className={styles.salesTable}>
          <h1 className={styles.pageTitle} style={{ fontSize: 20 }}>
            Sales - {month}
          </h1>

          {Object.entries(days).map(([day, sales]) => {
            const total = sales.reduce(
              (acc, sale) => acc + sale.quantitySold * sale.sellingPrice,
              0
            );

            let totalCash = 0;
            let totalBank = 0;

            sales.forEach((sale) => {
              sale.paidWith.forEach((payment) => {
                const method =
                  typeof payment.method === "string"
                    ? payment.method.toLowerCase()
                    : "";
                const amount = Number(payment.amount);

                if (method === "cash") {
                  totalCash += amount;
                } else {
                  totalBank += amount;
                }
              });
            });

            return (
              <div key={day} style={{ marginBottom: "30px" }}>
                {role === "admin" && (
                  <h3
                    style={{
                      margin: "10px 5px",
                      fontSize: 14,
                    }}
                  >
                    {day} — Total: {total.toLocaleString()} ETB | Cash:{" "}
                    {totalCash.toLocaleString()} ETB | Bank:{" "}
                    {totalBank.toLocaleString()} ETB
                  </h3>
                )}

                <div className={styles.tableContainer}>
                  <table className={styles.productTable}>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Quantity Sold</th>
                        <th>Customer Name</th>
                        <th>Plate Number</th>
                        <th>Address</th>
                        {role === "admin" && <th>Selling Price</th>}
                        {role === "admin" && <th>Paid With</th>}
                        {role === "admin" && <th>Payment Status</th>}
                        {role === "admin" && <th>Total</th>}
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{sale.productName || "--"}</td>
                          <td>{sale.quantitySold?.toLocaleString() || "--"}</td>
                          <td>{sale.customerName || "--"}</td>
                          <td>{sale.plateNo || "--"}</td>
                          <td>{sale.address || "--"}</td>
                          {role === "admin" && (
                            <td>{sale.sellingPrice || "--"}</td>
                          )}

                          {role === "admin" && (
                            <td style={{ width: 250 }}>
                              {Array.isArray(sale.paidWith) ? (
                                sale.paidWith.map((p, i) => (
                                  <div key={i}>
                                    {sale.paymentStatus === "paid" ||
                                    sale.paymentStatus === "partial" ? (
                                      <>
                                        <div style={{ paddingBottom: 10 }}>
                                          <strong>
                                            {String(p.method) || "Unknown"}:
                                          </strong>{" "}
                                          {Number(
                                            p.amount || 0
                                          ).toLocaleString()}{" "}
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
                          )}
                          {role === "admin" && (
                            <td
                              style={{
                                color:
                                  sale.paymentStatus === "credit" ||
                                  sale.paymentStatus === "partial"
                                    ? "red"
                                    : "black",
                              }}
                            >
                              {sale.paymentStatus || "--"}
                            </td>
                          )}
                          {role === "admin" && (
                            <td>
                              {(
                                sale.quantitySold * sale.sellingPrice
                              ).toLocaleString()}{" "}
                              ETB
                            </td>
                          )}
                          <td>
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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
