"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * Download PDF for any table
 * @param {Array} data - array of objects
 * @param {String} title - PDF title
 * @param {Array} columns - array of { header: string, key: string, format?: fn }
 */
export function downloadPDF(data, title, columns) {
  if (!data || data.length === 0) return;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 15);

  const tableData = data.map((row) =>
    columns.map((col) => {
      let value = row[col.key];
      if (col.format) value = col.format(value, row);
      return value ?? "--";
    })
  );

  autoTable(doc, {
    startY: 25,
    head: [columns.map((col) => col.header)],
    body: tableData,
  });

  doc.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Dashboard() {
  const [expensesData, setExpensesData] = useState([]);

  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [modalType, setModalType] = useState(""); // purchases, sales, expenses, credits, transactions
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/products");
        setProducts(response.data);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    async function fetchExpenses() {
      try {
        const response = await axios.get("/api/auth/expenses");
        setExpensesData(response.data);
      } catch (err) {
        console.error("Error fetching products", err);
      }
    }

    async function fetchSales() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/sell");
        setSales(response.data);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    async function fetchPurchases() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/purchase");
        setPurchases(response.data);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    async function fetchTrxns() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/bankInfo");
        setTransactions(response.data?.bankTransaction);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchTrxns();
    fetchPurchases();
    fetchSales();
    fetchExpenses();
    fetchProducts();
  }, []);
  const totalSales = sales
    .filter((s) => s.paymentStatus === "paid")
    .reduce((sum, s) => sum + s.quantitySold * s.sellingPrice, 0);

  const totalPurchases = purchases
    .filter((p) => p.paymentStatus === "paid")
    .reduce((sum, p) => sum + p.quantity * p.purchasingPrice, 0);

  const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);

  const profit = totalSales - (totalPurchases + totalExpenses);

  const profitLossData = [
    { name: "Income", value: totalSales },
    { name: "Expense", value: totalPurchases + totalExpenses },
    { name: profit >= 0 ? "Profit" : "Loss", value: Math.abs(profit) },
  ];
  const pieData = [
    { name: "Income", value: totalSales },
    { name: "Expense", value: totalPurchases + totalExpenses },
  ];
  const PIE_COLORS = ["#011544", "#94a3b8"];
  // Total sold per product
  const productSalesMap = {};

  // ⏱ date range (default: last 30 days)
  const movementFrom = fromDate
    ? new Date(fromDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const movementTo = toDate ? new Date(toDate) : new Date();
  movementTo.setHours(23, 59, 59, 999);

  // filter sales by time
  const salesInPeriod = sales.filter(
    (s) =>
      new Date(s.createdAt) >= movementFrom &&
      new Date(s.createdAt) <= movementTo
  );

  // aggregate sales per product
  salesInPeriod.forEach((s) => {
    if (!productSalesMap[s.productId]) {
      productSalesMap[s.productId] = {
        productName: s.productName,
        totalSold: 0,
      };
    }
    productSalesMap[s.productId].totalSold += s.quantitySold;
  });

  const [salesPeriod, setSalesPeriod] = useState("daily");
  // daily | weekly | monthly | yearly
  const isInPeriod = (date, period) => {
    const d = new Date(date);
    const now = new Date();

    if (period === "daily") {
      return d.toDateString() === now.toDateString();
    }

    if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }

    if (period === "monthly") {
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }

    if (period === "yearly") {
      return d.getFullYear() === now.getFullYear();
    }

    return false;
  };
  const filteredSalesByPeriod = sales.filter(
    (s) => s.paymentStatus === "paid" && isInPeriod(s.createdAt, salesPeriod)
  );
  const filteredPurchasesByPeriod = purchases.filter(
    (p) => p.paymentStatus === "paid" && isInPeriod(p.createdAt, salesPeriod)
  );

  // Aggregate sales and purchases per day
  const periodDataMap = {};

  // Helper function to format date
  const formatDate = (d) => new Date(d).toLocaleDateString();

  filteredSalesByPeriod.forEach((s) => {
    const date = formatDate(s.createdAt);
    if (!periodDataMap[date])
      periodDataMap[date] = { date, sales: 0, purchases: 0 };
    periodDataMap[date].sales += s.quantitySold * s.sellingPrice;
  });

  filteredPurchasesByPeriod.forEach((p) => {
    const date = formatDate(p.createdAt);
    if (!periodDataMap[date])
      periodDataMap[date] = { date, sales: 0, purchases: 0 };
    periodDataMap[date].purchases += p.quantity * p.purchasingPrice;
  });

  const chartData = Object.values(periodDataMap).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const [dateError, setDateError] = useState("");
  const stockValuation = products.reduce((sum, p) => {
    const qty = (Number(p.inStore) || 0) + (Number(p.inShop) || 0);
    const cost = Number(p.purchasingPrice) || 0;
    return sum + qty * cost;
  }, 0);
  return (
    <div className={`${styles.expenseContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>
      <div className={styles.dashboardTop}>
        {/* LEFT: PROFIT & LOSS */}
        <div className={styles.profitCard}>
          <div className={styles.cardHeader}>
            <h3>Profit & Loss</h3>
            <p className={profit >= 0 ? styles.profitText : styles.lossText}>
              {profit >= 0 ? "Net Profit" : "Net Loss"}:{" "}
              {profit.toLocaleString()} ETB
            </p>
          </div>

          <div className={styles.chartRow}>
            {/* PIE */}
            <ResponsiveContainer height={290}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* BAR */}
            <ResponsiveContainer height={290}>
              <BarChart data={profitLossData}>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <Tooltip />
                <Bar dataKey="value" fill="#011544" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={styles.filterBox}>
          <div className={styles.filterHeader}>
            <div>
              <label>From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label>To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          {dateError && (
            <p style={{ color: "red", margin: "2px 0px 8px", fontSize: 14 }}>
              {dateError}
            </p>
          )}

          {["Purchases", "Sales", "Expenses", "Credits", "Transactions"].map(
            (type) => (
              <div key={type}>
                <div className={styles.filterSection}>
                  <span>{type}</span>
                  <button
                    className={styles.showBtn}
                    onClick={() => {
                      if (fromDate && toDate) {
                        setModalType(type.toLowerCase());
                        setShowModal(true);
                        setDateError(""); // clear previous error
                      } else {
                        setDateError("Please select both From and To dates."); // show inline text
                      }
                    }}
                  >
                    Show
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
      <div className={styles.salesChartContainer}>
        {/* Sales Table */}
        <div className={styles.salesTableWrapper}>
          {" "}
          <div className={styles.salesPeriodButtons}>
            {["daily", "weekly", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                onClick={() => setSalesPeriod(p)}
                className={salesPeriod === p ? styles.activePeriod : ""}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          {filteredSalesByPeriod.length > 0 ? (
            <table className={styles.salesTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Selling Price</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesByPeriod.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.productName}</td>
                    <td>{sale.quantitySold.toLocaleString()}</td>
                    <td>{sale.sellingPrice.toLocaleString()} ETB</td>
                    <td>
                      {(sale.quantitySold * sale.sellingPrice).toLocaleString()}{" "}
                      ETB
                    </td>
                    <td>{new Date(sale.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontSize: 20, paddingTop: 15 }}>
              {!loadingPage && "No Slaes Today"}
            </div>
          )}
        </div>

        {/* Purchase vs Sales Chart */}
        <div className={styles.salesChartBar}>
          <div style={{ textAlign: "center" }}>Purchase Vs Sales</div>
          <ResponsiveContainer height="100%">
            <BarChart
              data={chartData}
              // margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              width="100%"
            >
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Bar
                dataKey="sales"
                name="Sales"
                fill="#011544"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="purchases"
                name="Purchases"
                fill="#94a3b8"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={styles.stockValuationCard}>
        <h4>Stock Valuation</h4>
        <p className={styles.stockValue}>
          {stockValuation.toLocaleString()} ETB
        </p>

        <span className={styles.stockHint}>Based on purchasing price</span>
      </div>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>
              {modalType.charAt(0).toUpperCase() + modalType.slice(1)} from{" "}
              {fromDate} to {toDate}
            </h3>

            {(() => {
              const from = new Date(fromDate);
              const to = new Date(toDate);
              to.setHours(23, 59, 59, 999); // include full end date

              let data = [];

              if (modalType === "purchases") {
                data = purchases.filter(
                  (p) =>
                    new Date(p.createdAt) >= from && new Date(p.createdAt) <= to
                );
                return (
                  <>
                    <div className={styles.tableWrapper}>
                      <table className={styles.modalTable}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Purchasing Price</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item) => (
                            <tr key={item.id}>
                              <td>{item.productName}</td>
                              <td>{item.quantity.toLocaleString()}</td>
                              <td>
                                {item.purchasingPrice.toLocaleString()} ETB
                              </td>
                              <td>
                                {" "}
                                {(
                                  Number(item.quantity) *
                                  Number(item.purchasingPrice)
                                ).toLocaleString()}{" "}
                                ETB
                              </td>
                              <td>
                                {item.paymetnStatus === "paid"
                                  ? "PAID"
                                  : item.paymetnStatus === "unpaid"
                                  ? "CREDIT"
                                  : ""}
                              </td>
                              <td>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>{" "}
                    </div>
                    {purchases.length > 0 && (
                      <button
                        onClick={() =>
                          downloadPDF(purchases, "Purchases Report", [
                            { header: "Product", key: "productName" },
                            { header: "Quantity", key: "quantity" },
                            {
                              header: "Purchasing Price",
                              key: "purchasingPrice",
                              format: (v) => Number(v).toLocaleString(),
                            },
                            {
                              header: "Total",
                              key: "total",
                              format: (_, row) =>
                                (
                                  row.quantity * row.purchasingPrice
                                ).toLocaleString(),
                            },
                            { header: "Status", key: "paymentStatus" },
                            {
                              header: "Date",
                              key: "createdAt",
                              format: (v) => new Date(v).toLocaleDateString(),
                            },
                          ])
                        }
                      >
                        Download PDF
                      </button>
                    )}
                  </>
                );
              }

              if (modalType === "sales") {
                const filteredSales = sales.filter(
                  (s) =>
                    new Date(s.createdAt) >= from && new Date(s.createdAt) <= to
                );
                return (
                  <>
                    <div className={styles.tableWrapper}>
                      <table className={styles.modalTable}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Selling Price</th>
                            <th>Total</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                              <td>{sale.productName}</td>
                              <td>{sale.quantitySold}</td>
                              <td>{sale.sellingPrice} ETB</td>
                              <td>
                                {(
                                  Number(sale.quantitySold) *
                                  Number(sale.sellingPrice)
                                ).toLocaleString()}{" "}
                                ETB
                              </td>
                              <td>
                                {new Date(sale.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filteredSales.length > 0 && (
                      <button
                        onClick={() =>
                          downloadPDF(sales, "Sales Report", [
                            { header: "Product", key: "productName" },
                            { header: "Quantity", key: "quantitySold" },
                            {
                              header: "Selling Price",
                              key: "sellingPrice",
                              format: (v) => Number(v).toLocaleString(),
                            },
                            {
                              header: "Total",
                              key: "total",
                              format: (_, row) =>
                                (
                                  row.quantitySold * row.sellingPrice
                                ).toLocaleString(),
                            },
                            {
                              header: "Date",
                              key: "createdAt",
                              format: (v) => new Date(v).toLocaleDateString(),
                            },
                          ])
                        }
                      >
                        Download PDF
                      </button>
                    )}
                  </>
                );
              }

              if (modalType === "expenses") {
                const filtered = expensesData.filter(
                  (e) =>
                    new Date(e.createdAt) >= from && new Date(e.createdAt) <= to
                );
                return (
                  <>
                    <div className={styles.tableWrapper}>
                      <table className={styles.modalTable}>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Note</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((e) => (
                            <tr key={e.id}>
                              <td>{e.title}</td>
                              <td>{e.amount} ETB</td>
                              <td>{e.paymentMethod}</td>
                              <td>{e.note}</td>
                              <td>
                                {new Date(e.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {expensesData.length > 0 && (
                      <button
                        onClick={() =>
                          downloadPDF(expensesData, "Expenses Report", [
                            { header: "Title", key: "title" },
                            {
                              header: "Amount",
                              key: "amount",
                              format: (v) => Number(v).toLocaleString(),
                            },
                            { header: "Method", key: "paymentMethod" },
                            { header: "Note", key: "note" },
                            {
                              header: "Date",
                              key: "createdAt",
                              format: (v) => new Date(v).toLocaleDateString(),
                            },
                          ])
                        }
                      >
                        Download PDF
                      </button>
                    )}
                  </>
                );
              }

              if (modalType === "credits") {
                if (modalType === "credits") {
                  // Combine credits from sales and purchases
                  const allCredits = [
                    ...purchases
                      .filter(
                        (p) =>
                          p.paymentStatus === "credit" &&
                          new Date(p.createdAt) >= from &&
                          new Date(p.createdAt) <= to
                      )
                      .map((p) => ({
                        id: p.id,
                        type: "Given",
                        productName: p.productName,
                        quantity: p.quantity,
                        price: p.purchasingPrice,
                        total: p.quantity * p.purchasingPrice,
                        date: p.createdAt,
                      })),
                    ...sales
                      .filter(
                        (s) =>
                          s.paymentStatus === "credit" &&
                          new Date(s.createdAt) >= from &&
                          new Date(s.createdAt) <= to
                      )
                      .map((s) => ({
                        id: s.id,
                        type: "Taken",
                        productName: s.productName,
                        quantity: s.quantitySold,
                        price: s.sellingPrice,
                        total: s.quantitySold * s.sellingPrice,
                        date: s.createdAt,
                      })),
                  ];

                  return (
                    <>
                      <div className={styles.tableWrapper}>
                        <table className={styles.modalTable}>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total</th>
                              <th>Credit Type</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allCredits.map((item) => (
                              <tr key={item.id}>
                                <td>{item.productName}</td>
                                <td>{item.quantity.toLocaleString()}</td>
                                <td>{item.price.toLocaleString()} ETB</td>
                                <td>{item.total.toLocaleString()} ETB</td>
                                <td>{item.type}</td>
                                <td>
                                  {new Date(item.date).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>{" "}
                      </div>
                      {allCredits.length > 0 && (
                        <button
                          onClick={() =>
                            downloadPDF(allCredits, "Credits Report", [
                              { header: "Product", key: "productName" },
                              { header: "Quantity", key: "quantity" },
                              {
                                header: "Price",
                                key: "price",
                                format: (v) => Number(v).toLocaleString(),
                              },
                              {
                                header: "Total",
                                key: "total",
                                format: (_, row) =>
                                  (
                                    row.quantitySold * row.sellingPrice
                                  ).toLocaleString(),
                              },
                              { header: "Type", key: "type" },
                              {
                                header: "Date",
                                key: "createdAt",
                                format: (v) => new Date(v).toLocaleDateString(),
                              },
                            ])
                          }
                        >
                          Download PDF
                        </button>
                      )}
                    </>
                  );
                }
              }

              if (modalType === "transactions") {
                const filtered = transactions.filter(
                  (e) =>
                    new Date(e.createdAt) >= from && new Date(e.createdAt) <= to
                );
                return (
                  <>
                    <div className={styles.tableWrapper}>
                      <table className={styles.modalTable}>
                        <thead>
                          <tr>
                            <th>Transaction Reason</th>
                            <th>Amount</th>
                            <th>Bank Name</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((e) => (
                            <tr key={e.id}>
                              <td>{e.type}</td>
                              <td>{e.amount} ETB</td>
                              <td>
                                {e.bankName &&
                                Array.isArray(e.bankName) &&
                                e.bankName.length > 0 ? (
                                  e.bankName.map((entry, i) => (
                                    <div key={i}>
                                      {String(entry.method) || "Unknown"}:{" "}
                                      {entry.amount
                                        ? Number(entry.amount).toLocaleString()
                                        : "0"}{" "}
                                      ETB
                                    </div>
                                  ))
                                ) : (
                                  <span>{!loadingPage && "No bank info"}</span>
                                )}
                              </td>

                              <td>
                                {new Date(e.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {filtered.length > 0 && (
                      <button
                        onClick={() =>
                          downloadPDF(transactions, "Transactions Report", [
                            { header: "Reason", key: "type" },
                            {
                              header: "Amount",
                              key: "amount",
                              format: (v) => Number(v).toLocaleString(),
                            },
                            {
                              header: "Bank Name",
                              key: "bankName",
                              format: (v) =>
                                Array.isArray(v)
                                  ? v
                                      .map(
                                        (b) =>
                                          `${b.method}: ${Number(
                                            b.amount
                                          ).toLocaleString()}`
                                      )
                                      .join(", ")
                                  : v || "--",
                            },
                            {
                              header: "Date",
                              key: "createdAt",
                              format: (v) => new Date(v).toLocaleDateString(),
                            },
                          ])
                        }
                      >
                        Download PDF
                      </button>
                    )}
                  </>
                );
              }

              return <p>{!loadingPage && "No data to display."}</p>;
            })()}

            <button
              onClick={() => setShowModal(false)}
              style={{
                padding: "8px 10px",
                float: "right",
                margin: "10px",
                backgroundColor: "red",
                outline: "none",
                borderRadius: "5px",
              }}
            >
              Close
            </button>
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
