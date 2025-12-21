"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FiPlus, FiEdit, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import styles from "../../page.module.css";
import { Jura } from "next/font/google";
import { useRouter } from "next/navigation";
const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function CashBookDetail() {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const [cashBook, setCashBook] = useState(null);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [transactionData, setTransactionData] = useState({
    type: "CASH_IN",
    transactionTitle: "",
    cashBookUser: "",
    amount: "",
    remark: "",
  });
  const [filterType, setFilterType] = useState("ALL");
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState({
    type: "CASH_IN",
    transactionTitle: "",
    cashBookUser: "",
    amount: "",
    remark: "",
  });
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    fetchCashBook();
  }, [id]);

  async function fetchCashBook() {
    setLoadingPage(true);
    try {
      const res = await axios.get(`/api/auth/cashbook/${id}`);
      setCashBook(res.data.cashBook);
    } catch (err) {
      showToast("error", "Failed to fetch cash book");
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    setLoadingPage(true);
    try {
      await axios.post(`/api/auth/cashbook/${id}`, transactionData);
      setTransactionData({
        type: "CASH_IN",
        amount: "",
        remark: "",
        transactionTitle: "",
        cashBookUser: "",
      });
      setShowAddTransaction(false);
      fetchCashBook();
      showToast("success", "Cashbook added successfully");
    } catch (err) {
      showToast("error", "Failed to add transaction");
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleDeleteTransaction(transactionId) {
    setLoadingPage(true);
    try {
      await axios.delete(`/api/auth/cashbook/${id}`, {
        data: { id: txnToDelete.id },
      });
      fetchCashBook();
      setShowDeleteModal(false);
      showToast("success", "Cashbook deleted successfully");
    } catch (err) {
      showToast("error", "Failed to delete transaction");
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleEditTransaction(transactionId) {
    setLoadingPage(true);
    try {
      await axios.put(`/api/auth/cashbook/${id}`, {
        id: transactionId,
        ...editingTransaction,
      });
      setEditingTransactionId(null);
      setEditingTransaction({
        type: "CASH_IN",
        amount: "",
        remark: "",
        transactionTitle: "",
        cashBookUser: "",
      });
      fetchCashBook();
      showToast("success", "Cashbook edited successfully");
    } catch (err) {
      showToast("error", "Failed to edit cashbook");
    } finally {
      setLoadingPage(false);
    }
  }

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [txnToDelete, setTxnToDelete] = useState(null);
  if (!cashBook) return <p>Loading...</p>;

  const filteredTransactions =
    filterType === "ALL"
      ? cashBook.transactions
      : cashBook.transactions.filter((t) => t.type === filterType);

  const { totalIn, totalOut } = cashBook.transactions.reduce(
    (acc, t) => {
      if (t.type === "CASH_IN") {
        acc.totalIn += t.amount;
      } else if (t.type === "CASH_OUT") {
        acc.totalOut += t.amount;
      }
      return acc;
    },
    { totalIn: 0, totalOut: 0 }
  );
  const totalBalance = totalIn - totalOut;
  const filteredSearchedTransactions = filteredTransactions.filter(
    (cb) =>
      cb.transactionTitle.toLowerCase().includes(search.toLowerCase()) ||
      cb.createdAt.includes(search)
  );
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTxnToDelete(null);
  };
  const handleDeleteClick = (t) => {
    setTxnToDelete(t);
    setShowDeleteModal(true);
  };
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.cashbookContent} ${jura.className}`}>
      <div className={styles.cashBookDetailPage}>
        <div className={styles.home_top}>
          <h1
            className={styles.pageTitle}
            style={{
              display: "flex",
              gap: "5px",
              alignItems: "center",
            }}
          >
            <div
              onClick={() => router.push("/cashbook")} // adjust path to your list page
              style={{
                padding: "5px 10px",
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                backgroundColor: "#f5f5f5",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              <FiArrowLeft />
            </div>
            <div>{cashBook.title}</div>
          </h1>
          <div className={styles.topBar}>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button
              onClick={() => setShowAddTransaction(!showAddTransaction)}
              className={styles.addButton}
            >
              <FiPlus size={20} />
            </button>
          </div>
        </div>
        <div
          style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "10px 5px",
            backgroundColor: "#fff",
            borderRadius: "5px",
            margin: "10px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: " center",
              borderBottom: ".5px solid #c1c0c0ff",
              padding: "10px 5px",
            }}
          >
            <div>Net Balance</div>
            <div style={{ textAlign: "center" }}>{totalBalance}</div>
          </div>
          <div
            style={{
              fontSize: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: " center",
              padding: "5px",
            }}
          >
            <div>Total In</div>
            <div style={{ textAlign: "center", color: "green" }}>{totalIn}</div>
          </div>
          <div
            style={{
              fontSize: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: " center",
              padding: "5px",
            }}
          >
            <div>Total Out</div>
            <div style={{ textAlign: "center", color: "red" }}>-{totalOut}</div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className={styles.filterButtons}>
          <button
            onClick={() => setFilterType("ALL")}
            className={filterType === "ALL" ? styles.activeFilter : ""}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("CASH_IN")}
            style={{
              color: filterType === "CASH_IN" ? "#fff" : "green",
              border: filterType === "CASH_IN" ? "" : "1px solid green",
              backgroundColor: filterType === "CASH_IN" ? "green" : "#fff",
            }}
          >
            Cash In
          </button>
          <button
            onClick={() => setFilterType("CASH_OUT")}
            style={{
              color: filterType === "CASH_OUT" ? "#fff" : "red",
              border: filterType === "CASH_OUT" ? "" : "1px solid red",
              backgroundColor: filterType === "CASH_OUT" ? "red" : "#fff",
            }}
          >
            Cash Out
          </button>
        </div>

        <AnimatePresence>
          {showAddTransaction && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddTransaction}
              className={styles.transactionForm}
            >
              <select
                value={transactionData.type}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
              >
                <option value="CASH_IN">CASH IN</option>
                <option value="CASH_OUT">CASH OUT</option>
              </select>
              <input
                type="text"
                placeholder="Transaction Title"
                value={transactionData.transactionTitle}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    transactionTitle: e.target.value,
                  }))
                }
                required
              />
              <input
                type="text"
                placeholder="Entry By"
                value={transactionData.cashBookUser}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    cashBookUser: e.target.value,
                  }))
                }
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={transactionData.amount}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                required
              />
              <input
                type="text"
                placeholder="Remark / Note"
                value={transactionData.remark}
                onChange={(e) =>
                  setTransactionData((prev) => ({
                    ...prev,
                    remark: e.target.value,
                  }))
                }
              />
              <button type="submit">Add Transaction</button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <div className={styles.transactionList}>
          {filteredSearchedTransactions.map((t) => (
            <div key={t.id} className={styles.transactionBox}>
              {editingTransactionId === t.id ? (
                <>
                  <select
                    value={editingTransaction.type}
                    onChange={(e) =>
                      setEditingTransaction((prev) => ({
                        ...prev,
                        type: e.target.value,
                      }))
                    }
                  >
                    <option value="CASH_IN">CASH IN</option>
                    <option value="CASH_OUT">CASH OUT</option>
                  </select>
                  <input
                    type="text"
                    value={editingTransaction.transactionTitle}
                    onChange={(e) =>
                      setEditingTransaction((prev) => ({
                        ...prev,
                        transactionTitle: e.target.value,
                      }))
                    }
                  />{" "}
                  <input
                    type="text"
                    value={editingTransaction.cashBookUser || "Entry By"}
                    onChange={(e) =>
                      setEditingTransaction((prev) => ({
                        ...prev,
                        cashBookUser: e.target.value,
                      }))
                    }
                  />{" "}
                  <input
                    type="number"
                    value={editingTransaction.amount}
                    onChange={(e) =>
                      setEditingTransaction((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    value={editingTransaction.remark}
                    onChange={(e) =>
                      setEditingTransaction((prev) => ({
                        ...prev,
                        remark: e.target.value,
                      }))
                    }
                  />
                  <button onClick={() => handleEditTransaction(t.id)}>
                    Save
                  </button>
                  <button onClick={() => setEditingTransactionId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #9d9c9cff",
                      padding: "15px 7px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        border:
                          t.type === "CASH_IN"
                            ? "1px solid green"
                            : "1px solid red",
                        color: t.type === "CASH_IN" ? "green" : "red",
                        padding: "7px 11px",
                      }}
                    >
                      {t.transactionTitle}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        textAlign: "center",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "17px",
                          padding: "5px",
                          color: t.type === "CASH_IN" ? "green" : "red",
                        }}
                      >
                        {t.type === "CASH_OUT" && "-"}
                        {t.amount}
                      </div>
                      <div style={{ fontSize: "11px", color: "#444" }}>
                        {t.balanceAfter}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px 7px",
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#373737ff" }}>
                      Entry By {t.cashBookUser || "Unknown"} on{" "}
                      {new Date(t.createdAt).getHours() +
                        ":" +
                        new Date(t.createdAt).getMinutes()}
                    </div>
                    <div style={{ fontSize: "13px", color: "#373737ff" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={styles.transactionActions}>
                    <FiEdit
                      onClick={() => {
                        setEditingTransactionId(t.id);
                        setEditingTransaction({
                          type: t.type,
                          amount: t.amount,
                          transactionTitle: t.transactionTitle,
                          remark: t.remark || "",
                          cashBookUser: t.cashBookUser || "",
                        });
                      }}
                    />
                    <FiTrash2 onClick={() => handleDeleteClick(t)} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Are you sure you want to delete this Cash?</h2>
              <p>Deleting this cashbook will delete all the transactions</p>
              <p>
                <strong>{txnToDelete.transactionTitle}</strong>
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={handleDeleteTransaction}
                  className={styles.confirmButton}
                >
                  Yes, Delete
                </button>
                <button onClick={cancelDelete} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>{" "}
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
