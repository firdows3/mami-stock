"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { Jura } from "next/font/google";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Home() {
  const [search, setSearch] = useState("");
  const [salesData, setSalesData] = useState([]);
  const [role, setRole] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState("");
  useEffect(() => {
    const fetchUser = async () => {
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
      }
    };

    fetchUser();
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
  const [editSalesId, setEditSalesId] = useState(null);
  const [editSalesData, setEditSalesData] = useState({
    productId: "",
    productName: "",
    sellingPrice: "",
    quantitySold: "",
    customerName: "",
    plateNo: "",
    address: "",
    saleSource: "",
    paymentStatus: "",
    paidWith: [],
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const handleEditClick = (sales) => {
    setEditSalesId(sales.id);
    setEditSalesData({
      productId: sales.productId,
      productName: sales.productName,
      sellingPrice: sales.sellingPrice,
      quantitySold: sales.quantitySold,
      customerName: sales.customerName,
      plateNo: sales.plateNo,
      address: sales.address,
      saleSource: sales.saleSource,
      paymentStatus: sales.paymentStatus,
      paidWith: sales.paidWith || [],
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditSalesData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaidWithChange = (index, field, value) => {
    const updated = [...editSalesData.paidWith];
    updated[index][field] = value;
    setEditSalesData((prev) => ({ ...prev, paidWith: updated }));
  };

  const addPaidWithRow = () => {
    setEditSalesData((prev) => ({
      ...prev,
      paidWith: [...prev.paidWith, { method: "", amount: "" }],
    }));
  };

  const removePaidWithRow = (index) => {
    setEditSalesData((prev) => ({
      ...prev,
      paidWith: prev.paidWith.filter((_, i) => i !== index),
    }));
  };

  const handleCancelEdit = () => {
    setEditSalesId(null);
    setEditSalesData({ title: "", amount: "", paymentMethod: "", note: "" });
  };

  const handleEditSubmit = async (id) => {
    setLoadingPage(true);
    try {
      await axios.put("/api/auth/sell", {
        id,
        ...editSalesData,
      });

      setEditSalesId(null);
      setEditSalesData({
        productId: "",
        productName: "",
        sellingPrice: "",
        quantitySold: "",
        customerName: "",
        plateNo: "",
        address: "",
        saleSource: "",
        paymentStatus: "",
        paidWith: [],
      });

      const response = await axios.get("/api/auth/sell");
      setSalesData(response.data);
      showToast("success", "Sales edited successfully");
    } catch (err) {
      showToast("error", "Failed to edit sales");
    } finally {
      setLoadingPage(false);
    }
  };

  const handleDeleteClick = (sale) => {
    setSaleToDelete(sale);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setLoadingPage(true);
    try {
      await axios.delete("/api/auth/sell", {
        data: { id: saleToDelete.id },
      });
      setShowDeleteModal(false);
      setSaleToDelete(null);

      const response = await axios.get("/api/auth/sell");
      setSalesData(response.data);
      showToast("success", "Sales deleted successfully");
    } catch (err) {
      showToast("error", "Failed to delete sales");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setSaleToDelete(null);
  };

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

    sales &&
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

  const groupedSales = groupSalesByMonthAndDay(filteredSales);
  const paidMethods = {};

  salesData.length > 0 &&
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
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.slaesContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage Sales</h1>

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

            sales.length > 0 &&
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
              <div key={sales.id} style={{ marginBottom: "30px" }}>
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
                        <th>Sales Source</th>
                        <th>Selling Price</th>
                        <th>Paid With</th>
                        <th>Customer Name</th>
                        <th>Plate Number</th>
                        <th>Address</th>
                        <th>Payment Status</th>
                        {role === "admin" && <th>Total</th>}
                        <th>Date</th>
                        {role === "admin" && <th></th>}
                        {role === "admin" && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((sale) => (
                        <tr key={sale.id}>
                          {editSalesId === sale.id ? (
                            <>
                              <td>
                                <input
                                  type="text"
                                  name="productName"
                                  value={editSalesData.productName}
                                  onChange={handleEditChange}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  name="quantitySold"
                                  value={editSalesData.quantitySold}
                                  onChange={handleEditChange}
                                />
                              </td>
                              <td>
                                <select
                                  name="paymentStatus"
                                  onChange={handleEditChange}
                                  value={editSalesData.saleSource}
                                  required
                                >
                                  <option value="">Select Sales Source</option>
                                  <option value="shop">Shop</option>
                                  <option value="store">Store</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  name="sellingPrice"
                                  value={editSalesData.sellingPrice}
                                  onChange={handleEditChange}
                                />
                              </td>
                              <td style={{ width: 300 }}>
                                {editSalesData.paidWith?.length > 0 &&
                                  editSalesData.paidWith.map(
                                    (payment, index) => {
                                      const expectedAmount =
                                        Number(editSalesData.quantitySold) *
                                        Number(editSalesData.sellingPrice);

                                      const additionalPaidSum =
                                        editSalesData.paidWith
                                          .slice(1)
                                          .reduce(
                                            (acc, p) =>
                                              acc + Number(p.amount || 0),
                                            0
                                          );

                                      const firstAmount =
                                        index === 0
                                          ? expectedAmount - additionalPaidSum
                                          : payment.amount;

                                      // If this is the first payment row, update state so it's stored correctly
                                      if (
                                        index === 0 &&
                                        payment.amount !== firstAmount
                                      ) {
                                        const updated = [
                                          ...editSalesData.paidWith,
                                        ];
                                        updated[0] = {
                                          ...updated[0],
                                          amount: firstAmount,
                                        };
                                        setEditSalesData((prev) => ({
                                          ...prev,
                                          paidWith: updated,
                                        }));
                                      }

                                      return (
                                        <div
                                          key={index}
                                          style={{
                                            display: "flex",
                                            gap: "5px",
                                            marginBottom: "5px",
                                          }}
                                        >
                                          <input
                                            type="text"
                                            placeholder="Method"
                                            value={payment.method}
                                            onChange={(e) =>
                                              handlePaidWithChange(
                                                index,
                                                "method",
                                                e.target.value
                                              )
                                            }
                                          />

                                          {index === 0 &&
                                          editSalesData.paymentStatus ===
                                            "paid" ? (
                                            // Fixed display for first amount
                                            <div
                                              style={{
                                                padding: "0 10px",
                                                lineHeight: "32px",
                                                border: "1px solid #ccc",
                                                borderRadius: 4,
                                                minWidth: 100,
                                              }}
                                            >
                                              {firstAmount.toLocaleString()} ETB
                                            </div>
                                          ) : (
                                            // Editable input for other amounts
                                            <input
                                              type="number"
                                              placeholder="Amount"
                                              min={0}
                                              max={expectedAmount}
                                              value={payment.amount}
                                              onChange={(e) => {
                                                let value = Number(
                                                  e.target.value
                                                );
                                                if (value < 0) value = 0;
                                                if (value > expectedAmount)
                                                  value = expectedAmount;

                                                const updated = [
                                                  ...editSalesData.paidWith,
                                                ];
                                                updated[index] = {
                                                  ...updated[index],
                                                  amount: value,
                                                };

                                                // Recalculate first row amount when others change
                                                const newAdditionalSum = updated
                                                  .slice(1)
                                                  .reduce(
                                                    (acc, p) =>
                                                      acc +
                                                      Number(p.amount || 0),
                                                    0
                                                  );
                                                updated[0] = {
                                                  ...updated[0],
                                                  amount:
                                                    expectedAmount -
                                                    newAdditionalSum,
                                                };

                                                setEditSalesData({
                                                  ...editSalesData,
                                                  paidWith: updated,
                                                });
                                              }}
                                              required
                                            />
                                          )}

                                          <button
                                            type="button"
                                            onClick={() =>
                                              removePaidWithRow(index)
                                            }
                                          >
                                            X
                                          </button>
                                        </div>
                                      );
                                    }
                                  )}
                                <button type="button" onClick={addPaidWithRow}>
                                  + Add Payment Method
                                </button>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  name="customerName"
                                  value={editSalesData.customerName}
                                  onChange={handleEditChange}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  name="plateNo"
                                  value={editSalesData.plateNo}
                                  onChange={handleEditChange}
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  name="address"
                                  value={editSalesData.address}
                                  onChange={handleEditChange}
                                />
                              </td>
                              <td>
                                <select
                                  name="paymentStatus"
                                  onChange={handleEditChange}
                                  value={editSalesData.paymentStatus}
                                  required
                                >
                                  <option value="">
                                    Select payment status
                                  </option>
                                  <option value="paid">Paid</option>
                                  <option value="credit">Credit</option>
                                  <option value="partial">Partial</option>
                                </select>
                              </td>
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
                              <td>
                                <button
                                  onClick={() => handleEditSubmit(sale.id)}
                                >
                                  Save
                                </button>
                                <button onClick={handleCancelEdit}>
                                  Cancel
                                </button>
                              </td>
                              <td></td>
                            </>
                          ) : (
                            <>
                              {" "}
                              <td>{sale.productName || "--"}</td>
                              <td>
                                {sale.quantitySold?.toLocaleString() || "--"}
                              </td>
                              <td>
                                {sale.saleSource?.toLocaleString() || "--"}
                              </td>
                              <td>
                                {sale.sellingPrice?.toLocaleString()}{" "}
                                {sale.sellingPrice ? "ETB" : "--"}
                              </td>
                              {sale.paymentStatus === "paid" ||
                              sale.paymentStatus === "partial" ? (
                                <td style={{ width: "250px" }}>
                                  {Array.isArray(sale.paidWith) ? (
                                    sale.paidWith?.length > 0 &&
                                    sale.paidWith.map((p, i) => (
                                      <div key={i}>
                                        {p.method !== "" && (
                                          <div
                                            key={i}
                                            style={{
                                              paddingBottom: 10,
                                              borderBottom:
                                                "1px solid rgba(112, 112, 112, 0.5)",
                                            }}
                                          >
                                            <strong>{String(p.method)}:</strong>{" "}
                                            {Number(
                                              p.amount || 0
                                            ).toLocaleString()}{" "}
                                            ETB
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <span>--</span>
                                  )}
                                </td>
                              ) : (
                                <td>--</td>
                              )}
                              <td>{sale.customerName || "--"}</td>
                              <td>{sale.plateNo || "--"}</td>
                              <td>{sale.address || "--"}</td>
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
                              {role === "admin" && (
                                <td>
                                  <button
                                    className={styles.editButton}
                                    onClick={() => handleEditClick(sale)}
                                  >
                                    Edit
                                  </button>
                                </td>
                              )}
                              {role === "admin" && (
                                <td>
                                  <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDeleteClick(sale)}
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Are you sure you want to delete this expense?</h2>
            <p>
              <strong>{saleToDelete.productName}</strong> —{" "}
              {saleToDelete.quantitySold} ETB — {saleToDelete.customerName} —{" "}
              {saleToDelete.plateNo} — {saleToDelete.address}
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
