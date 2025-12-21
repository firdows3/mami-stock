"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Home() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("taken");
  const [takenCredits, setTakenCredits] = useState([]);
  const [givenCredits, setGivenCredits] = useState([]);
  const [amount, setAmount] = useState(null);
  const [amountRem, setAmountRem] = useState(null);
  const [note, setNote] = useState("");
  const [paidWith, setPaidWith] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null); // the credit user wants to pay for
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [selectedHistoryCredit, setSelectedHistoryCredit] = useState(null);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);

  const displayedData = viewMode === "taken" ? takenCredits : givenCredits;
  const filteredcredits = displayedData.filter((p) => {
    const monthYear = new Date(p.date).toLocaleString("default", {
      month: "long",
      year: "numeric",
    }); // e.g., "July 2025"
    const matchesPaidWith = Array.isArray(p.paidWith)
      ? p.paidWith.some((entry) =>
          entry.method?.toLowerCase().includes(search.toLowerCase())
        )
      : false;

    return (
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      matchesPaidWith ||
      p.date.includes(search) ||
      monthYear.toLowerCase().includes(search.toLowerCase())
    );
  });

  function groupcreditsByMonth(credits) {
    const grouped = {};

    credits.forEach((credit) => {
      const date = new Date(credit.date);
      const key = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }); // e.g., "July 2025"

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(credit);
    });

    return grouped;
  }

  const groupedcredits = groupcreditsByMonth(filteredcredits);

  useEffect(() => {
    async function fetchPurchases() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/purchase");

        const takenCredit = response.data.filter(
          (p) => p.paymentStatus === "credit" || p.paymentStatus === "partial"
        );

        const withRemaining = await Promise.all(
          takenCredit.map(async (credit) => {
            const res = await axios.get(
              `/api/auth/creditPayment?id=${credit.id}`
            );
            const payments = res.data || [];
            const paidTotal = payments.reduce(
              (sum, pay) => sum + Number(pay.amount),
              0
            );

            const total =
              Number(credit.quantity) * Number(credit.purchasingPrice);
            return {
              ...credit,
              remainingAmount: total - paidTotal,
            };
          })
        );
        setTakenCredits(withRemaining);
      } catch (err) {
        showToast("error", "Failed to fetch purchases");
      } finally {
        setLoadingPage(false);
      }
    }

    async function fetchSells() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/sell");
        const givenCredit = response.data.filter(
          (p) => p.paymentStatus === "credit" || p.paymentStatus === "partial"
        );
        const withRemaining = await Promise.all(
          givenCredit.map(async (credit) => {
            const res = await axios.get(
              `/api/auth/creditPayment?id=${credit.id}`
            );
            const payments = res.data || [];
            const paidTotal = payments.reduce(
              (sum, pay) => sum + Number(pay.amount),
              0
            );

            const total =
              Number(credit.quantitySold) * Number(credit.sellingPrice);
            return {
              ...credit,
              remainingAmount: total - paidTotal,
            };
          })
        );
        setGivenCredits(withRemaining);
      } catch (err) {
        showToast("error", "Failed to fetch sales.");
      } finally {
        setLoadingPage(false);
      }
    }
    fetchSells();
    fetchPurchases();
  }, []);

  const openPaymentHistory = async (credit) => {
    setLoadingPage(true);
    try {
      const res = await axios.get(`/api/auth/creditPayment?id=${credit.id}`);
      setPaymentHistory(res.data);
      setShowPaymentHistoryModal(true);
    } catch (error) {
      showToast("error", "Failed to fetch payment history");
    } finally {
      setLoadingPage(false);
    }
  };

  const [bankData, setBankData] = useState([]);
  useEffect(() => {
    async function fetchBankInfo() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/bankInfo");
        setBankData(response.data?.bankInfo);
      } catch (err) {
        showToast("error", "Failed to fetch bank information");
      } finally {
        setLoadingPage(false);
      }
    }

    fetchBankInfo();
  }, []);

  function calculateTotals(credits) {
    let totalRemaining = 0;
    let totalQuantity = 0;

    credits.forEach((credit) => {
      totalRemaining += credit.remainingAmount || 0;
      if (viewMode === "taken") {
        totalQuantity += Number(credit.quantity) || 0;
      } else {
        totalQuantity += Number(credit.quantitySold) || 0;
      }
    });

    return { totalRemaining, totalQuantity };
  }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.creditContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage credits</h1>

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
      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleBtn} ${
            viewMode === "taken" ? styles.active : ""
          } ${jura.className}`}
          onClick={() => setViewMode("taken")}
        >
          Taken
        </button>

        <button
          className={`${styles.toggleBtn} ${
            viewMode === "given" ? styles.active : ""
          } ${jura.className}`}
          onClick={() => setViewMode("given")}
        >
          Given
        </button>
      </div>
      {Object.keys(groupedcredits).length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          {!loadingPage && " No credits found."}
        </p>
      ) : (
        Object.entries(groupedcredits).map(([month, credits]) => {
          const { totalRemaining, totalQuantity } = calculateTotals(credits);
          return (
            <div key={month} className={styles.creditsTable}>
              <h1 className={styles.pageTitle} style={{ fontSize: 20 }}>
                Credits - {month} (Remaining: {totalRemaining.toLocaleString()}{" "}
                ETB | Qty: {totalQuantity.toLocaleString()})
              </h1>
              <div className={styles.tableContainer}>
                <table className={styles.productTable}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Creditor Name</th>
                      <th>Remaining Amount</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {credits.map((credit) => (
                      <tr key={credit.id}>
                        <td>{credit.productName}</td>
                        <td>
                          {viewMode === "taken"
                            ? credit.quantity.toLocaleString()
                            : credit.quantitySold.toLocaleString()}
                        </td>
                        <td>
                          {viewMode === "taken"
                            ? credit.supplierName
                            : credit.customerName}
                        </td>
                        <td>{credit.remainingAmount?.toLocaleString()} ETB</td>
                        <td>
                          {viewMode === "taken"
                            ? (
                                Number(credit.quantity) *
                                Number(credit.purchasingPrice)
                              ).toLocaleString()
                            : (
                                Number(credit.quantitySold) *
                                Number(credit.sellingPrice)
                              ).toLocaleString()}{" "}
                          ETB
                        </td>
                        <td>{new Date(credit.date).toLocaleDateString()}</td>
                        <td>
                          <button
                            className={styles.paymentHistoryBtn}
                            onClick={() => {
                              openPaymentHistory(credit);
                              setSelectedHistoryCredit(credit);
                            }}
                          >
                            Payment History
                          </button>
                        </td>
                        <td>
                          <button
                            className={styles.payButton}
                            onClick={() => {
                              setSelectedCredit(credit);
                              setShowPayModal(true);
                              if (viewMode === "taken") {
                                setAmountRem(credit.purchasingPrice);
                              } else setAmountRem(credit.sellingPrice);
                            }}
                          >
                            {viewMode === "taken" ? "Pay" : "Paid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
      {showPayModal && selectedCredit && (
        <div className={styles.modalOverlay}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h2 style={{ margin: "10px 0px" }}>
              Pay Credit for {selectedCredit.productName} {viewMode}
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoadingPage(true);
                try {
                  await axios.post("/api/auth/creditPayment", {
                    type: viewMode === "taken" ? "purchase" : "sale",
                    id: selectedCredit.id,
                    amount: Number(amount),
                    amountRem: Number(amountRem),
                    note,
                    paidWith,
                  });

                  // Refresh credits after payment
                  const response = await axios.get("/api/auth/purchase");
                  setTakenCredits(
                    response.data.filter(
                      (p) =>
                        p.paymentStatus === "credit" ||
                        p.paymentStatus === "partial"
                    )
                  );
                  const res = await axios.get("/api/auth/sell");
                  setGivenCredits(
                    res.data.filter(
                      (p) =>
                        p.paymentStatus === "credit" ||
                        p.paymentStatus === "partial"
                    )
                  );

                  // Reset modal states and close modal
                  setShowPayModal(false);
                  setSelectedCredit(null);
                  setAmount(null);
                  setNote("");
                  setPaidWith([{ amount: "", method: "" }]);
                  setAmountRem("");
                  showToast("success", "Payment successfull");
                } catch (err) {
                  showToast("error", "failed to pay");
                } finally {
                  setLoadingPage(false);
                }
              }}
              className={styles.expenseForm}
            >
              <input
                type="number"
                required
                value={amount ?? ""}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount Paid"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note"
              />
              <input
                list="bank-options"
                value={paidWith}
                onChange={(e) => setPaidWith(e.target.value)}
                placeholder="Paid With"
                required
              />

              <datalist id="bank-options">
                {bankData.map((bank) => (
                  <option key={bank.id} value={bank.bankName} />
                ))}
              </datalist>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loadingPage}
                style={{
                  backgroundColor: loadingPage ? "#9aa7d9" : "#2563eb",
                  cursor: loadingPage ? "not-allowed" : "pointer",
                  opacity: loadingPage ? 0.9 : 1,
                }}
              >
                Submit Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedCredit(null);
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {showPaymentHistoryModal && selectedHistoryCredit && (
        <div className={styles.modalOverlay}>
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <h2>Payment History for {selectedHistoryCredit.productName}</h2>
            {paymentHistory.length === 0 ? (
              <p>{!loadingPage && "No payments found."}</p>
            ) : (
              <table className={styles.productTable}>
                <thead>
                  <tr>
                    <th>Amount Paid</th>
                    <th>Remaining Amount</th>
                    <th>Paid With</th>
                    <th>Note</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment) => (
                    <tr key={payment.id}>
                      <td>{Number(payment.amount).toLocaleString()} ETB</td>
                      <td>
                        {payment.amountRemaining
                          ? Number(payment.amountRemaining).toLocaleString()
                          : "0"}{" "}
                        ETB
                      </td>
                      <td>{payment.paidWith}</td>
                      <td>{payment.note || "-"}</td>
                      <td>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              className={styles.cancelButton}
              onClick={() => setShowPaymentHistoryModal(false)}
            >
              Close
            </button>
          </motion.div>
        </div>
      )}{" "}
      <AnimatePresence>
        {toast.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              background: toast.type === "success" ? "#16a34a" : "#dc2626",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: 8,
              zIndex: 9999,
              boxShadow: "0 10px 30px rgba(0,0,0,.2)",
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
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
