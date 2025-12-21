"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { MdWarningAmber } from "react-icons/md";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Download PDF for grouped bank transactions
 * @param {Object} groupedData - { month: { day: [transactions] } }
 */
export function downloadBankTransactionsPDF(groupedData) {
  const doc = new jsPDF();
  let yOffset = 15;

  doc.setFontSize(16);
  doc.text("Bank Transactions Report", 14, yOffset);
  yOffset += 10;

  Object.entries(groupedData).forEach(([month, days]) => {
    doc.setFontSize(14);
    doc.text(`Month: ${month}`, 14, yOffset);
    yOffset += 8;

    Object.entries(days).forEach(([day, txns]) => {
      doc.setFontSize(12);
      const dayTotal = txns
        .reduce(
          (acc, txn) =>
            acc +
            txn.bankName?.reduce(
              (sum, entry) => sum + Number(entry.amount || 0),
              0
            ),
          0
        )
        .toLocaleString();

      doc.text(`Day: ${day}  |  Total: ${dayTotal} ETB`, 14, yOffset);
      yOffset += 6;

      const tableData = txns.map((txn) => {
        const amounts = Array.isArray(txn.bankName)
          ? txn.bankName
              .map((p) => Number(p.amount || 0).toLocaleString())
              .join(", ")
          : "--";
        const methods = Array.isArray(txn.bankName)
          ? txn.bankName.map((p) => String(p.method)).join(", ")
          : "--";
        return [
          txn.type,
          amounts,
          methods,
          new Date(txn.createdAt).toLocaleDateString(),
        ];
      });

      autoTable(doc, {
        startY: yOffset,
        head: [["Reason", "Amount", "Payment Method", "Date"]],
        body: tableData,
        margin: { left: 14, right: 14 },
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 },
        didDrawPage: (data) => {
          yOffset = data.cursor.y + 6;
        },
      });
    });

    yOffset += 6; // extra space between months
  });

  doc.save("bank-transactions.pdf");
}

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Home() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [bankData, setBankData] = useState([]);
  const [bankTrans, setBankTrans] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    bankName: "",
    accountNo: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("All");
  const [loadingPage, setLoadingPage] = useState(true);
  const [toast, setToast] = useState({ type: "", message: "" });

  const handleEditClick = (bankInfo) => {
    setEditId(bankInfo.id);
    setEditData({
      bankName: bankInfo.bankName,
      accountNo: bankInfo.accountNo,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (id) => {
    setLoadingPage(true);
    try {
      await axios.put("/api/auth/bankInfo", { id, ...editData });
      setEditId(null);
      fetchDataAgain(); // refetch updated data
      showToast("success", "Bank edited successfully");
    } catch (err) {
      showToast("error", "Failed to edit bank");
    } finally {
      setLoadingPage(false);
    }
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditData({ bankName: "", accountNo: "" });
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoadingPage(true);
    try {
      await axios.delete("/api/auth/bankInfo", {
        data: { id: deleteId },
      });
      setShowDeleteModal(false);
      setDeleteId(null);
      fetchDataAgain();
      showToast("success", "Deleted bank successfully");
    } catch (err) {
      showToast("error", "Failed to delete bank");
    } finally {
      setLoadingPage(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const fetchDataAgain = async () => {
    const response = await axios.get("/api/auth/bankInfo");
    setBankData(response.data?.bankInfo);
    setBankTrans(response.data?.bankTransaction);
  };

  const filteredBankTrans = bankTrans?.filter((p) => {
    const monthYear = new Date(p.createdAt).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    const matchesSearch =
      (Array.isArray(p.bankName) &&
        p.bankName?.some((entry) =>
          String(entry.method || "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )) ||
      p.type?.toLowerCase().includes(search.toLowerCase()) ||
      p.createdAt.includes(search) ||
      monthYear.toLowerCase().includes(search.toLowerCase());
    const matchesMethod =
      selectedMethod === "All" ||
      (Array.isArray(p.bankName) &&
        p.bankName?.some((entry) => entry.method === selectedMethod));

    return matchesSearch && matchesMethod;
  });

  const paymentMethods = [
    ...new Set(
      bankTrans.flatMap((txn) =>
        (txn.bankName || [])
          .map((entry) => entry.method)
          .filter((m) => typeof m === "string" && m.trim() !== "")
      )
    ),
  ];

  function groupBankTransByMonthAndDay(transactions) {
    const grouped = {};

    transactions.forEach((txn) => {
      const dateObj = new Date(txn.createdAt);
      const month = dateObj.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }); // e.g. "July 2025"
      const day = dateObj.toLocaleDateString(); // e.g. "7/29/2025" or "29/07/2025"

      if (!grouped[month]) grouped[month] = {};
      if (!grouped[month][day]) grouped[month][day] = [];

      grouped[month][day].push(txn);
    });

    return grouped;
  }

  const groupedBankTrans = groupBankTransByMonthAndDay(filteredBankTrans);

  useEffect(() => {
    async function fetchBankInfo() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/bankInfo");
        setBankData(response.data?.bankInfo);
        setBankTrans(response.data?.bankTransaction);
      } catch (err) {
        showToast("error", "Failed to load data");
      } finally {
        setLoadingPage(false);
      }
    }

    fetchBankInfo();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };

  const [loading, setLoading] = useState(false);
  const handleBankInfo = async (e) => {
    e.preventDefault();
    if (loadingPage) return;
    setLoadingPage(true);
    try {
      await axios.post("/api/auth/bankInfo", {
        bankName: bankName,
        accountNo: accountNo,
      });

      setAccountNo("");
      setBankName("");

      setShowAddForm(false);

      const response = await axios.get("/api/auth/bankInfo");
      setBankData(response.data.bankInfo);
    } catch (err) {
      showToast("error", "Failed to fetch bank");
    } finally {
      setLoadingPage(false);
    }
  };
  console.log(groupedBankTrans);

  return (
    <div className={`${styles.bankInfoContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Bank Information</h1>

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
            <form className={styles.expenseForm} onSubmit={handleBankInfo}>
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                onChange={(e) => setBankName(e.target.value)}
                required
              />
              <input
                type="text"
                name="accountNo"
                placeholder="Account Number"
                required
                onChange={(e) => setAccountNo(e.target.value)}
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
                Add Bank
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {bankData.length === 0 && !loadingPage && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "26px",
            color: "#555",
          }}
        >
          No bank account added yet
        </div>
      )}
      {bankData.length > 0 && (
        <div className={styles.bankInfosTable}>
          <div className={styles.tableContainer}>
            <table className={styles.productTable}>
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>AccountNumber</th>
                  <th>Created At</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bankData &&
                  Array.isArray(bankData) &&
                  bankData.map((bankInfo) => (
                    <tr key={bankInfo.id}>
                      {editId === bankInfo.id ? (
                        <>
                          <td>
                            <input
                              name="bankName"
                              type="text"
                              value={editData.bankName}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            <input
                              name="accountNo"
                              type="text"
                              value={editData.accountNo}
                              onChange={handleEditChange}
                            />
                          </td>
                          <td>
                            {new Date(bankInfo.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              onClick={() => handleEditSubmit(bankInfo.id)}
                            >
                              Save
                            </button>
                            <button onClick={handleCancelEdit}>Cancel</button>
                          </td>
                          <td></td>
                        </>
                      ) : (
                        <>
                          <td>{bankInfo.bankName} ETB</td>
                          <td>{bankInfo.accountNo}</td>
                          <td>
                            {new Date(bankInfo.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditClick(bankInfo)}
                            >
                              Edit
                            </button>
                          </td>
                          <td>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteClick(bankInfo.id)}
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
      )}
      <div
        style={{
          display: "flex",
          marginBottom: "20px",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 10,
        }}
      >
        <button
          onClick={() => setSelectedMethod("All")}
          style={{
            background: selectedMethod === "All" ? "#444" : "#ddd",
            color: selectedMethod === "All" ? "#fff" : "#000",
            padding: "6px 12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          All
        </button>

        {paymentMethods.map((method) => (
          <button
            key={method}
            onClick={() => setSelectedMethod(method)}
            style={{
              background: selectedMethod === method ? "#444" : "#ddd",
              color: selectedMethod === method ? "#fff" : "#000",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {method}
          </button>
        ))}
      </div>
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

      {Object.entries(groupedBankTrans).map(([month, days]) => (
        <div key={month} className={styles.expensesTable}>
          <h1 className={styles.pageTitle} style={{ fontSize: 20 }}>
            Bank Transactions - {month}
          </h1>

          {Object.entries(days).map(([day, txns]) => (
            <div key={day} style={{ marginBottom: "30px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  // flexDirection: "column",
                  gap: 10,
                }}
              >
                <h3 style={{ fontSize: 16, marginBottom: 5 }}>{day}</h3>
                <h4 style={{ fontSize: 14, marginBottom: 10 }}>
                  Total:{" "}
                  {Array.isArray(txns)
                    ? txns
                        .reduce(
                          (acc, transaction) =>
                            acc +
                            transaction.bankName?.reduce(
                              (sum, entry) => sum + Number(entry.amount || 0),
                              0
                            ),
                          0
                        )
                        .toLocaleString()
                    : "0"}{" "}
                  ETB
                </h4>
                <button
                  onClick={() => downloadBankTransactionsPDF(groupedBankTrans)}
                  style={{
                    marginBottom: "1rem",
                    backgroundColor: "#28a745",
                    color: "white",
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Download PDF
                </button>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.productTable}>
                  <thead>
                    <tr>
                      <th>Reason</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((txn) => (
                      <tr key={txn.id}>
                        <td>{txn.type}</td>
                        <td style={{ width: 250 }}>
                          {Array.isArray(txn.bankName) &&
                            txn.bankName.map((p, i) => (
                              <div key={i}>
                                <div style={{ paddingBottom: 10 }}>
                                  <span>
                                    {Number(p.amount || 0).toLocaleString()} ETB
                                  </span>{" "}
                                </div>
                              </div>
                            ))}
                        </td>
                        <td style={{ width: 250 }}>
                          {Array.isArray(txn.bankName) &&
                            txn.bankName.map((p, i) => (
                              <div key={i}>
                                <div style={{ paddingBottom: 10 }}>
                                  <span>{String(p.method) || "Unknown"}</span>{" "}
                                </div>
                              </div>
                            ))}
                        </td>
                        <td>{new Date(txn.createdAt).toLocaleDateString()}</td>
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
            <MdWarningAmber size={48} color="orange" />
            <p>Are you sure you want to delete this transaction?</p>
            <div className={styles.modalActions}>
              <button onClick={confirmDelete} className={styles.confirmDelete}>
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
    </div>
  );
}
