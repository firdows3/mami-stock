"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Jura } from "next/font/google";
import axios from "axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Store() {
  const [allProducts, setAllProducts] = useState([]);
  const [role, setRole] = useState("");
  const [sendingRowId, setSendingRowId] = useState("");
  const [openSending, setOpenSending] = useState(false);
  const [error, setError] = useState("");
  const [sendForm, setSendForm] = useState([
    {
      productId: "",
      productName: "",
      sellingPrice: "",
      buyingPrice: "",
      quantitySent: "",
      date: "",
    },
  ]);
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
    async function fetchProducts() {
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/products");
        setAllProducts(response.data);
      } catch (err) {
        console.error("Error fetching products", err);
      } finally {
        setLoadingPage(false);
      }
    }

    fetchProducts();
  }, []);
  const [search, setSearch] = useState("");
  const filteredProducts = allProducts.filter(
    (p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.inStore.toLocaleString().includes(search.toLowerCase()) ||
      p.sellingPrice.toLocaleString().includes(search.toLowerCase())
  );
  const [rowsToShow, setRowsToShow] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * rowsToShow;
  const endIndex = startIndex + rowsToShow;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsToShow]);

  const totalValue = filteredProducts.reduce(
    (acc, curr) => acc + curr.inStore * curr.sellingPrice,
    0
  );
  const [sentHistory, setSentHistory] = useState([]);
  const [openSentHistory, setOpenSentHistory] = useState(false);
  const [sentProductId, setSentProductId] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  // const fetchSentHistory = async (productId) => {
  //   try {
  //     const res = await axios.get(
  //       `/api/auth/sendToShop?productId=${productId}`
  //     );
  //     setSentHistory(res.data);
  //     setSentProductId(productId);
  //     setOpenSentHistory(true);
  //   } catch (err) {
  //     console.error("Failed to fetch sales history", err);
  //   }
  // };

  // const handleSend = async (e) => {
  //   e.preventDefault();

  //   try {
  //     for (let form of sendForm) {
  //       await axios.post("/api/auth/sendToShop", {
  //         productId: sendingRowId,
  //         productName: form.productName,
  //         sellingPrice: Number(form.sellingPrice),
  //         buyingPrice: Number(form.buyingPrice),
  //         quantitySent: Number(form.quantitySent),
  //         date: new Date(),
  //       });
  //     }
  //     setOpenSending(false);
  //     setSendForm([
  //       {
  //         productId: "",
  //         productName: "",
  //         sellingPrice: "",
  //         buyingPrice: "",
  //         quantitySent: "", // keep default
  //         date: "",
  //       },
  //     ]);
  //     const response = await axios.get("/api/auth/sendToShop");
  //     setSentHistory(response.data);
  //   } catch (err) {
  //     console.error("sending to shop failed", err);
  //     setError(
  //       err.response?.data?.message || err.message || "Something went wrong"
  //     );
  //   }
  // };

  // useEffect(() => {
  //   const selectedProduct = allProducts.find((p) => p.id === sendingRowId);
  //   if (selectedProduct) {
  //     setSendForm((prev) => {
  //       const updated = [...prev];
  //       updated[0] = {
  //         ...updated[0],
  //         productName: selectedProduct.productName,
  //       };
  //       return updated;
  //     });
  //   }
  // }, [sendingRowId]);

  const totalSold = sentHistory.reduce(
    (total, sale) => total + sale.quantitySent * sale.sellingPrice,
    0
  );
  return (
    <div className={`${styles.mainContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage store</h1>
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
      {role == "admin" && (
        <div style={{ fontWeight: "900", textAlign: "right", margin: 10 }}>
          Total Selling Price in Shop 116: {totalValue.toLocaleString()} ETB
        </div>
      )}
      <div className={styles.tableContainer}>
        <table className={`${styles.productTable} ${jura.className} `}>
          <thead style={{ fontWeight: "800", fontSize: "17px" }}>
            <tr>
              <th>Product Name</th>
              <th>Quantity</th>
              {role == "admin" && <th>Selling Price</th>}
              {role == "admin" && <th>Total</th>}
              <th>Date</th>
              {/* <th></th>
              <th></th> */}
            </tr>
          </thead>
          <tbody style={{ textAlign: "center" }}>
            {paginatedProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.productName ? product?.productName : "--"}</td>
                <td>
                  {product.inStore ? product?.inStore.toLocaleString() : "--"}
                </td>
                {role == "admin" && (
                  <td>
                    {product.sellingPrice
                      ? product?.sellingPrice.toLocaleString() + " ETB"
                      : "--"}
                  </td>
                )}
                {role == "admin" && (
                  <td>
                    {product?.sellingPrice && product.inStore
                      ? (
                          product?.sellingPrice * product.inStore
                        ).toLocaleString() + " ETB"
                      : "--"}{" "}
                  </td>
                )}
                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                {/* <td>
                  <button
                    className={styles.addButton}
                    onClick={() => {
                      setOpenSentHistory(true);
                      fetchSentHistory(product?.id);
                    }}
                  >
                    Sent History
                  </button>
                </td> */}
                {/* <td>
                  <button
                    className={styles.sellButton}
                    onClick={() => {
                      setSendingRowId(product?.id);
                      setOpenSending(true);
                    }}
                    disabled={product.inStore === 0}
                    style={{
                      opacity: product.inStore === 0 ? 0.5 : 1,
                      cursor:
                        product.inShop === 0 && product.inStore === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Send to Shop
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.rowsSelector}>
        <label htmlFor="rows">Rows to show: </label>
        <select
          id="rows"
          value={rowsToShow}
          onChange={(e) => setRowsToShow(Number(e.target.value))}
          style={{ backgroundColor: "#fff", color: "#000", outline: "none" }}
        >
          <option value={20}>20</option>
          <option value={40}>40</option>
          <option value={60}>60</option>
        </select>
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <FiChevronLeft />
          </button>
          <button
            onClick={() =>
              setCurrentPage((prev) =>
                endIndex < filteredProducts.length ? prev + 1 : prev
              )
            }
            disabled={endIndex >= filteredProducts.length}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
      {/* {openSentHistory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sent to Shop History</h3>

            {sentHistory.length === 0 ? (
              <p>No sent to shop history found.</p>
            ) : (
              <>
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Qunatity Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentHistory.map((sale) => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.date).toLocaleDateString()}</td>
                        <td>{sale.quantitySent.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setOpenSentHistory(false);
                setSentHistory([]);
                setSentProductId("");
              }}
              className={styles.cancelButton}
            >
              Close
            </button>
          </div>
        </div>
      )} */}
      {/* {openSending && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Send Products to Shop</h3> */}
      {/* Header for main selected product */}
      {/* {sendingRowId && (
              <div className={styles.purchaseHeader}>
                <h4>Main Product</h4>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <div>
                    <p>
                      <strong>Name:</strong>{" "}
                      {allProducts.find((p) => p.id === sendingRowId)
                        ?.productName || ""}
                    </p>
                  </div> */}
      {/* <div>
                    <p>
                      <strong>Price:</strong>{" "}
                      {allProducts
                        .find((p) => p.id === seingRowId)
                        ?.sellingPrice.toLocaleString() + " ETB" || ""}
                    </p>
                  </div> */}
      {/* <div>
                    <p>
                      <strong>Quantity in Shop:</strong>{" "}
                      {allProducts.find((p) => p.id === sendingRowId)
                        ?.inStore || ""}
                    </p>
                  </div>
                </div>
              </div>
            )} */}
      {/* Purchase Form for current product */}
      {/* {sendForm.length > 0 &&
              sendForm?.map((form, index) => (
                <form
                  onSubmit={handleSend}
                  key={index}
                  style={{
                    marginTop: "15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <select
                    onChange={(e) => {
                      const selectedProduct = allProducts.find(
                        (p) => p.productName === e.target.value
                      );
                      setSendForm((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                          ...updated[index],
                          productId: selectedProduct?.id,
                          productName: selectedProduct?.productName,
                          sellingPrice: selectedProduct?.sellingPrice,
                          buyingPrice: selectedProduct?.buyingPrice,
                        };
                        return updated;
                      });
                    }}
                    name="productName"
                    required
                  >
                    <option>Select product</option>
                    {allProducts.map((product) => (
                      <option key={product.id} value={product.productName}>
                        {product.productName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={form.quantitySent}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSendForm((prev) => {
                        const updated = [...prev];
                        updated[index].quantitySent = value;
                        return updated;
                      });
                    }}
                    required
                  />
                  <div
                    style={{ textAlign: "center", color: "red", fontSize: 11 }}
                  >
                    {error}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "20px",
                      marginTop: 10,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button type="submit" className={styles.confirmButton}>
                      Send to Shop
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setOpenSending(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ))}
            <button
              type="button"
              onClick={() =>
                setSendForm([
                  ...sendForm,
                  {
                    productId: "",
                    productName: "",
                    sellingPrice: "",
                    buyingPrice: "",
                    quantitySent: "",
                    date: "",
                  },
                ])
              }
              className={styles.addAnotherButton}
            >
              Add Another Item
            </button>
          </div>
        </div>
      )} */}{" "}
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
