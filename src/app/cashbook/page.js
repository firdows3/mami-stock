"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import styles from "../page.module.css";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Jura } from "next/font/google";
const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function CashBookList() {
  const [cashBooks, setCashBooks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);
  useEffect(() => {
    fetchCashBooks();
  }, []);

  async function fetchCashBooks() {
    setLoadingPage(true);
    try {
      const res = await axios.get("/api/auth/cashbook");
      setCashBooks(res.data);
    } catch (err) {
      showToast("error", "Failed to fetch cash book");
    } finally {
      setLoadingPage(false);
    }
  }

  // Create cashbook
  async function handleCreateCashBook(e) {
    e.preventDefault();
    setLoadingPage(true);
    if (!newTitle) return;
    try {
      await axios.post("/api/auth/cashbook", { title: newTitle });
      setLoading(true);
      setNewTitle("");
      setShowAddForm(false);
      fetchCashBooks();
      showToast("success", "Cashbook added seccessfully");
    } catch (err) {
      showToast("error", "Failed to add cash book");
    } finally {
      setLoadingPage(false);
    }
  }

  // Delete cashbook

  // Start editing
  function startEditCashBook(id, title) {
    setEditingId(id);
    setEditingTitle(title);
  }

  // Save edited title
  async function handleSaveEdit(id) {
    if (!editingTitle) return;
    setLoadingPage(true);
    try {
      await axios.put("/api/auth/cashbook", { id, title: editingTitle });
      setEditingId(null);
      setEditingTitle("");
      fetchCashBooks();
      showToast("success", "Cashbook updated successfully");
    } catch (err) {
      showToast("error", "Failed to update cash book");
    }
  }
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cashbookToDelete, setCashbookToDelete] = useState(null);
  const filteredCashbook = cashBooks.filter(
    (cb) =>
      cb.title.toLowerCase().includes(search.toLowerCase()) ||
      p.createdAt.includes(search)
  );
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCashbookToDelete(null);
  };
  const handleDeleteClick = (cb) => {
    setCashbookToDelete(cb);
    setShowDeleteModal(true);
  };
  async function handleDeleteCashBook(id) {
    setLoadingPage(true);
    try {
      await axios.delete("/api/auth/cashbook", {
        data: { id: cashbookToDelete.id },
      });
      setShowDeleteModal(false);
      fetchCashBooks();
      showToast("success", "Cashbook deleted successfully");
    } catch (err) {
      showToast("error", "Failed to delete cash book");
    }
  }
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.cashbookContent} ${jura.className}`}>
      <div className={styles.cashBookListPage}>
        <div className={styles.home_top}>
          <h1 className={styles.pageTitle}>My Cashbook</h1>
          <div className={styles.topBar}>
            <input
              type="text"
              placeholder="Search..."
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
        {/* Add New CashBook */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              className={styles.formContainer}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className={styles.pageTitle}>Add New Bank</h1>
              <form
                className={styles.expenseForm}
                onSubmit={handleCreateCashBook}
              >
                <input
                  type="text"
                  placeholder="New CashBook Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? "#9aa7d9" : "#2563eb",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.9 : 1,
                  }}
                >
                  Add Cashbook
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        {filteredCashbook.length === 0 && !loadingPage && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              fontSize: "26px",
              color: "#555",
            }}
          >
            No cash book added yet
          </div>
        )}
        {/* CashBook List */}
        <div className={styles.cashBookGrid}>
          {filteredCashbook.map((cb) => {
            const totalBalance =
              cb.transactions?.reduce(
                (acc, t) =>
                  t.type === "CASH_IN" ? acc + t.amount : acc - t.amount,
                0
              ) ?? 0;
            return (
              <div key={cb.id} className={styles.cashBookBox}>
                {editingId === cb.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                    />
                    <div className={styles.cashBookActions}>
                      <button onClick={() => handleSaveEdit(cb.id)}>
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href={`/cashbook/${cb.id}`}>
                      <h3 className={styles.cashBookTitle}>{cb.title}</h3>
                      <p
                        className={
                          totalBalance >= 0
                            ? styles.greenBalance
                            : styles.redBalance
                        }
                      >
                        Total Balance: {totalBalance}
                      </p>
                    </Link>
                    <div className={styles.cashBookActions}>
                      <FiEdit
                        className={styles.iconButton}
                        onClick={() => startEditCashBook(cb.id, cb.title)}
                      />
                      <FiTrash2
                        className={styles.iconButton}
                        onClick={() => handleDeleteClick(cb)}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2>Are you sure you want to delete this Cash?</h2>
              <p>Deleting this cashbook will delete all the transactions</p>
              <p>
                <strong>{cashbookToDelete.title}</strong>
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={handleDeleteCashBook}
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
