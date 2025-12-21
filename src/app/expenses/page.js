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
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState(null);
  const [note, setNote] = useState("");
  const [expensesData, setExpensesData] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [bankData, setBankData] = useState([]);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    async function fetchBankInfo() {
      try {
        setLoadingPage(true);
        const response = await axios.get("/api/auth/bankInfo");
        setBankData(response.data?.bankInfo);
      } catch (err) {
        console.error("Error fetching bankInfo", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchBankInfo();
  }, []);

  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editExpenseData, setEditExpenseData] = useState({
    title: "",
    amount: "",
    paymentMethod: "",
    note: "",
  });
  const handleEditClick = (expense) => {
    setEditExpenseId(expense.id);
    setEditExpenseData({
      title: expense.title,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      note: expense.note,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditExpenseData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (id) => {
    try {
      setLoadingPage(true);
      await axios.put("/api/auth/expenses", {
        id,
        ...editExpenseData,
      });

      setEditExpenseId(null);
      setEditExpenseData({
        title: "",
        amount: "",
        paymentMethod: "",
        note: "",
      });
      const response = await axios.get("/api/auth/expenses");
      setExpensesData(response.data);
      showToast("success", "Expense edited successfully");
    } catch (err) {
      showToast("error", "Failed to edit expense");
    } finally {
      setLoadingPage(false);
    }
  };

  const handleCancelEdit = () => {
    setEditExpenseId(null);
    setEditExpenseData({ title: "", amount: "", paymentMethod: "", note: "" });
  };

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoadingPage(true);
      await axios.delete("/api/auth/expenses", {
        data: { id: expenseToDelete.id },
      });
      setShowDeleteModal(false);
      setExpenseToDelete(null);

      const response = await axios.get("/api/auth/expenses");
      setExpensesData(response.data);
      showToast("success", "Expense deleted successfully");
    } catch (err) {
      showToast("error", "Failed to delete expense");
    } finally {
      setLoadingPage(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  const filteredexpenses = expensesData.filter((p) => {
    const monthYear = new Date(p.createdAt).toLocaleString("default", {
      month: "long",
      year: "numeric",
    }); // e.g., "July 2025"

    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.paymentMethod.toLowerCase().includes(search.toLowerCase()) ||
      p.note.toLowerCase().includes(search.toLowerCase()) ||
      p.createdAt.includes(search) ||
      monthYear.toLowerCase().includes(search.toLowerCase())
    );
  });

  function groupExpensesByMonthAndDay(expenses) {
    const grouped = {};

    expenses.forEach((expense) => {
      const dateObj = new Date(expense.createdAt);
      const monthKey = dateObj.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }); // e.g., "July 2025"

      const dayKey = dateObj.toLocaleDateString(); // e.g., "7/29/2025"

      if (!grouped[monthKey]) grouped[monthKey] = {};
      if (!grouped[monthKey][dayKey]) grouped[monthKey][dayKey] = [];

      grouped[monthKey][dayKey].push(expense);
    });

    return grouped;
  }

  const groupedexpenses = groupExpensesByMonthAndDay(filteredexpenses);

  useEffect(() => {
    async function fetchExpenses() {
      try {
        setLoadingPage(true);
        const response = await axios.get("/api/auth/expenses");
        setExpensesData(response.data);
      } catch (err) {
        console.error("Error fetching expenses", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchExpenses();
  }, []);

  const handleExpense = async (e) => {
    e.preventDefault();
    try {
      setLoadingPage(true);
      await axios.post("/api/auth/expenses", {
        title: title,
        paymentMethod: paymentMethod,
        amount: Number(amount),
        note: note,
      });

      setAmount(null);
      setNote("");
      setTitle("");
      setPaymentMethod("");

      setShowAddForm(false);

      const response = await axios.get("/api/auth/expenses");
      setExpensesData(response.data);
      showToast("success", "Expense added successfully");
    } catch (err) {
      showToast("error", "Failed to add expense");
    } finally {
      setLoadingPage(false);
    }
  };
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.expenseContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage expenses</h1>

        <div className={styles.topBar}>
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={styles.addButton}
          >
            <FiPlus size={20} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className={styles.formContainer}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className={styles.pageTitle}>Add New expense</h1>
            <form className={styles.expenseForm} onSubmit={handleExpense}>
              <input
                type="text"
                name="title"
                placeholder="Title"
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <input
                type="number"
                name="amount"
                onChange={(e) => setAmount(e.target.value)}
                placeholder="amount"
                required
              />
              <input
                type="text"
                name="note"
                placeholder="Note"
                onChange={(e) => setNote(e.target.value)}
              />
              <input
                name="paymentStatus"
                list="bank-options"
                // value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
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
                Add expense
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {expensesData.length === 0 && !loadingPage && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "26px",
            color: "#555",
          }}
        >
          No expenses added yet
        </div>
      )}
      {Object.entries(groupedexpenses).map(([month, days]) => (
        <div key={month} className={styles.expensesTable}>
          <h2 className={styles.pageTitle}>Expense - {month}</h2>

          {Object.entries(days).map(([day, dayExpenses]) => (
            <div key={day} style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", margin: "10px 0" }}>
                {day} — Total:{" "}
                {dayExpenses
                  .reduce((acc, expense) => acc + Number(expense.amount), 0)
                  .toLocaleString()}{" "}
                ETB
              </h3>

              <div className={styles.tableContainer}>
                <table className={styles.productTable}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Note</th>
                      <th>Date</th>
                      <th></th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayExpenses.map((expense) => (
                      <tr key={expense.id}>
                        {editExpenseId === expense.id ? (
                          <>
                            <td>
                              <input
                                type="text"
                                name="title"
                                value={editExpenseData.title}
                                onChange={handleEditChange}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                name="amount"
                                value={editExpenseData.amount}
                                onChange={handleEditChange}
                              />
                            </td>
                            <td>
                              <input
                                name="paymentMethod"
                                list="bank-options"
                                value={editExpenseData.paymentMethod}
                                onChange={handleEditChange}
                                placeholder="Paid With"
                                required
                              />
                              <datalist id="bank-options">
                                {bankData.map((bank) => (
                                  <option key={bank.id} value={bank.bankName} />
                                ))}
                              </datalist>
                            </td>
                            <td>
                              <input
                                type="text"
                                name="note"
                                value={editExpenseData.note}
                                onChange={handleEditChange}
                              />
                            </td>
                            <td>
                              {new Date(expense.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <button
                                onClick={() => handleEditSubmit(expense.id)}
                              >
                                Save
                              </button>
                              <button onClick={handleCancelEdit}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{expense.title}</td>
                            <td>{expense.amount.toLocaleString()} ETB</td>
                            <td>{expense.paymentMethod}</td>
                            <td>{expense.note}</td>
                            <td>
                              {new Date(expense.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                              <button
                                className={styles.editButton}
                                onClick={() => handleEditClick(expense)}
                              >
                                Edit
                              </button>
                            </td>
                            <td>
                              <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteClick(expense)}
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}

      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Are you sure you want to delete this expense?</h2>
            <p>
              <strong>{expenseToDelete.title}</strong> —{" "}
              {expenseToDelete.amount} ETB
            </p>
            <div className={styles.modalActions}>
              <button onClick={confirmDelete} className={styles.confirmButton}>
                Yes, Delete
              </button>
              <button onClick={cancelDelete} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
