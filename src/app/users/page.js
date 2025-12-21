"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import { FiPlus } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { MdWarningAmber } from "react-icons/md";
import axios from "axios";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Home() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [userData, setuserData] = useState([]);
  const [bankTrans, setBankTrans] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);
  const [editData, setEditData] = useState({
    username: "",
    phone: "",
    role: "",
  });

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (userId) => {
    setLoadingPage(true);
    try {
      await axios.put("/api/auth/users", {
        id: userId,
        ...editData,
      });

      showToast("success", "User updated successfully");
      // Refresh the list
      const response = await axios.get("/api/auth/users");
      setuserData(response.data);
      setEditUserId(null); // Exit edit mode
    } catch (err) {
      showToast("error", "Failed to update user");
    } finally {
      setLoadingPage(false);
    }
  };

  const handleCancel = () => {
    setEditUserId(null);
    setEditData({ username: "", phone: "", role: "" });
  };

  const filteredBankTrans = bankTrans?.filter((p) => {
    const monthYear = new Date(p.createdAt).toLocaleString("default", {
      month: "long",
      year: "numeric",
    }); // e.g., "July 2025"

    return (
      p.bankName.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      p.createdAt.includes(search) ||
      monthYear.toLowerCase().includes(search.toLowerCase())
    );
  });

  function groupBankTransByMonth(bankTranses) {
    const grouped = {};

    bankTranses.forEach((bankTrans) => {
      const date = new Date(bankTrans.createdAt);
      const key = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }); // e.g., "July 2025"

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(bankTrans);
    });

    return grouped;
  }

  const groupedBankTrans = groupBankTransByMonth(filteredBankTrans);

  useEffect(() => {
    async function fetchUserData() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/users");
        setuserData(response.data);
      } catch (err) {
        console.error("Error fetching bankInfo", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchUserData();
  }, []);

  const [loading, setLoading] = useState(false);
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setLoadingPage(true);
    try {
      await axios.post("/api/auth/users", {
        username: username,
        phone: phone,
        password: password,
        role: role,
      });

      setUsername("");
      setPassword("");
      setPhone("");
      setRole("");

      setShowAddForm(false);

      const response = await axios.get("/api/auth/users");
      setuserData(response.data);
      showToast("success", "User added successfully");
    } catch (err) {
      showToast("error", "Failed to add user");
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.bankInfoContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage Users</h1>

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
            <h1 className={styles.pageTitle}>Add New User</h1>
            <form className={styles.expenseForm} onSubmit={handleCreateUser}>
              <input
                type="text"
                name="username"
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                required
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="text"
                name="password"
                placeholder="Password"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
              <select
                name="role"
                value={role}
                required
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="shopper">Shopper</option>
                <option value="storekeeper">Storekeeper</option>
              </select>

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
                Add User
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={styles.bankInfosTable}>
        <div className={styles.tableContainer}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {userData &&
                Array.isArray(userData) &&
                userData.map((user) => (
                  <tr key={user.id}>
                    {editUserId === user.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="username"
                            value={editData.username}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="phone"
                            value={editData.phone}
                            onChange={handleEditChange}
                          />
                        </td>
                        <td>
                          <select
                            name="role"
                            value={editData.role}
                            onChange={handleEditChange}
                          >
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="shopper">Shopper</option>
                            <option value="storekeeper">Storekeeper</option>
                          </select>
                        </td>
                        <td>
                          <button onClick={() => handleEditSubmit(user.id)}>
                            Save
                          </button>
                          <button onClick={handleCancel}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{user.username}</td>
                        <td>{user.phone}</td>
                        <td>{user.role}</td>
                        <td>
                          <button
                            onClick={() => {
                              setEditUserId(user.id);
                              setEditData({
                                username: user.username,
                                phone: user.phone,
                                role: user.role,
                              });
                            }}
                            className={styles.editButton}
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
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
