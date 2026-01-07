"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Jura } from "next/font/google";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion, AnimatePresence } from "framer-motion";

function downloadSalesPDF(filteredSales, selectedSource) {
  if (!filteredSales || filteredSales.length === 0) return;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(`Sales History (${selectedSource.toUpperCase()})`, 14, 15);

  const tableData = filteredSales.map((sale) => [
    new Date(sale.date).toLocaleDateString(),
    sale.customerName || "--",
    sale.customerPhone || "--",
    sale.plateNo || "--",
    sale.address || "--",
    sale.quantitySold,
    sale.sellingPrice.toLocaleString(),
    sale.paymentStatus,
    (sale.quantitySold * sale.sellingPrice).toLocaleString(),
  ]);

  autoTable(doc, {
    startY: 25,
    head: [
      [
        "Date",
        "Customer",
        "Plate No",
        "Address",
        "Qty",
        "Price",
        "Status",
        "Total (ETB)",
      ],
    ],
    body: tableData,
  });

  doc.save(`sales-${selectedSource}.pdf`);
}
function downloadSentHistoryPDF(sentHistory) {
  if (!sentHistory || sentHistory.length === 0) return;

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Sent to Shop History", 14, 15);

  const tableData = sentHistory.map((item) => [
    new Date(item.date).toLocaleDateString(),
    item.quantitySent.toLocaleString(),
    item.source.toLocaleString(),
    item.destination.toLocaleString(),
  ]);

  autoTable(doc, {
    startY: 25,
    head: [["Date", "Quantity Sent"]],
    body: tableData,
  });

  doc.save("sent-to-shop-history.pdf");
}
const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Shop() {
  const [allProducts, setAllProducts] = useState([]);
  const [openSelling, setOpenSelling] = useState(false);
  const [sellingRowId, setSellingRowId] = useState("");
  const [sellForm, setSellForm] = useState([
    {
      productId: "",
      productName: "",
      sellingPrice: "",
      quantitySold: "",
      customerName: "",
      customerPhone: "",
      plateNo: "",
      address: "",
      paymentStatus: "",
      saleSource: "",
      paidWith: [
        {
          method: "", // e.g., "Cash", "Bank of Abyssinia", etc.
          amount: "",
        },
      ],
      date: "",
    },
  ]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [openSalesHistory, setOpenSalesHistory] = useState(false);
  const [salesProductId, setSalesProductId] = useState("");
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("credit");
  const [selectedSource, setSelectedSource] = useState("shop");
  const [role, setRole] = useState("");
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);
  useEffect(() => {
    if (role === "shop 116") {
      setSelectedSource("shop 116");
    } else if (role === "shop 235") {
      setSelectedSource("shop 235");
    } else {
      setSelectedSource("shop siti");
    }
  }, [role]);

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

  const fetchSalesHistory = async (productId) => {
    setLoadingPage(true);
    try {
      const res = await axios.get(`/api/auth/sell?productId=${productId}`);
      setSalesHistory(res.data);
      setSalesProductId(productId);
      setOpenSalesHistory(true);
    } catch (err) {
      console.error("Failed to fetch sales history", err);
    } finally {
      setLoadingPage(false);
    }
  };

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
  const [selectedShop, setSelectedShop] = useState("");
  useEffect(() => {
    if (role === "shop 235") setSelectedShop("shop235");
    if (role === "shop 116") setSelectedShop("shop116");
    if (role === "shop siti") setSelectedShop("shopsiti");
  }, [role]);
  const shopQtyMap = {
    shop235: "inShop235",
    shop116: "inShop116",
    shopsiti: "inShopSiti",
  };
  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch = p.productName
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // ADMIN: show all products
    if (role === "admin") {
      if (!selectedShop) return true;
      const qtyField = shopQtyMap[selectedShop];
      return (p[qtyField] || 0) > 0;
    }

    // SHOP USERS: only their shop
    const qtyField = shopQtyMap[selectedShop];
    return (p[qtyField] || 0) > 0;
  });

  const [rowsToShow, setRowsToShow] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * rowsToShow;
  const endIndex = startIndex + rowsToShow;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsToShow]);
  const [bankData, setBankData] = useState([]);
  useEffect(() => {
    async function fetchBankInfo() {
      setLoadingPage(true);
      try {
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

  const [forms, setForms] = useState([{}]); // Start with one form
  const [quantityError, setQuantityError] = useState("");
  const [amountError, setAmountError] = useState("");

  const totalValue = filteredProducts.reduce(
    (acc, curr) =>
      acc +
      (curr.inShop235 + curr.inShop116 + curr.inShopSiti) * curr.sellingPrice,
    0
  );

  const [loading, setLoading] = useState(false);
  const handleSell = async (e) => {
    e.preventDefault();
    if (loading) return;
    // Prepare sales with recalculated paidWith
    const totalSales =
      sellForm.length > 0 &&
      sellForm?.map((form) => {
        const expectedAmount =
          Number(form.quantitySold) * Number(form.sellingPrice);

        // Sum of amounts in all except the first payment
        const additionalPaidSum = form.paidWith
          .slice(1)
          .reduce((acc, p) => acc + Number(p.amount || 0), 0);

        // Clone paidWith and adjust first payment
        const updatedPaidWith = [...form.paidWith];
        if (form.paymentStatus !== "partial" && updatedPaidWith.length > 0) {
          updatedPaidWith[0].amount = expectedAmount - additionalPaidSum;
        }

        return {
          productId: form.productId,
          productName: form.productName,
          sellingPrice: Number(form.sellingPrice),
          quantitySold: Number(form.quantitySold),
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          plateNo: form.plateNo,
          address: form.address,
          paidWith: updatedPaidWith,
          paymentStatus: form.paymentStatus,
          saleSource: form.saleSource,
          date: form.date,
        };
      });
    setLoading(true);
    try {
      await Promise.all(
        totalSales?.map((sale) => axios.post("/api/auth/sell", sale))
      );

      setOpenSelling(false);
      setSellForm([
        {
          productId: "",
          productName: "",
          sellingPrice: "",
          quantitySold: "",
          customerName: "",
          customerPhone: "",
          plateNo: "",
          address: "",
          paymentStatus: "",
          saleSource: "",
          paidWith: [{ method: "", amount: "" }], // keep default
          date: "",
        },
      ]);
      setLoadingPage(true);
      const response = await axios.get("/api/auth/products");
      setAllProducts(response.data);
      showToast("success", "Successfull sales");
    } catch (err) {
      showToast("error", "Failed to sell");
    } finally {
      setLoadingPage(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const selectedProduct = allProducts.find((p) => p.id === sellingRowId);
    if (selectedProduct) {
      setSellForm((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          productName: selectedProduct.productName,
          sellingPrice: selectedProduct.sellingPrice,
        };
        return updated;
      });
      setQuantityError("");
      setAmountError("");
    }
  }, [sellingRowId]);
  const totalSold = salesHistory.reduce(
    (total, sale) => total + sale.quantitySold * sale.sellingPrice,
    0
  );

  const paidWithSummary = {};
  salesHistory.length > 0 &&
    salesHistory.forEach((sale) => {
      const totalAmount = sale.quantitySold * sale.sellingPrice;

      if (paidWithSummary[sale.paidWith]) {
        paidWithSummary[sale.paidWith] += totalAmount;
      } else {
        paidWithSummary[sale.paidWith] = totalAmount;
      }
    });

  useEffect(() => {
    sellForm.length > 0 &&
      sellForm.forEach((form) => {
        const expectedAmount =
          Number(form.quantitySold) * Number(form.sellingPrice);

        const totalPaid = form.paidWith.reduce(
          (acc, p) => acc + Number(p.amount || 0),
          0
        );

        if (totalPaid < expectedAmount) {
          setAmountError(
            `Total paid amount (${totalPaid.toLocaleString()}) is less than expected amount (${expectedAmount.toLocaleString()})`
          );
        } else {
          setAmountError("");
        }
      });
  }, [sellForm]);

  // const groupedSales = salesHistory.reduce(
  //   (groups, sale) => {
  //     if (sale.saleSource === "shop") {
  //       groups.shop.push(sale);
  //     } else if (sale.saleSource === "store") {
  //       groups.store.push(sale);
  //     } else {
  //       groups.other.push(sale); // fallback if no source
  //     }
  //     return groups;
  //   },
  //   { shop: [], store: [], other: [] }
  // );
  const [sendingRowId, setSendingRowId] = useState("");
  const [openSending, setOpenSending] = useState(false);
  const [sendForm, setSendForm] = useState([
    {
      productId: "",
      productName: "",
      source: "",
      destination: "",
      sellingPrice: "",
      buyingPrice: "",
      quantitySent: "",
      date: "",
    },
  ]);
  const handleSend = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      for (let form of sendForm) {
        await axios.post("/api/auth/sendToShop", {
          productId: sendingRowId,
          productName: form.productName,
          source: form.source,
          destination: form.destination,
          sellingPrice: Number(form.sellingPrice),
          buyingPrice: Number(form.buyingPrice),
          quantitySent: Number(form.quantitySent),
          date: new Date(),
        });
      }
      setOpenSending(false);
      setSendForm([
        {
          productId: "",
          productName: "",
          source: "",
          destination: "",
          sellingPrice: "",
          buyingPrice: "",
          quantitySent: "", // keep default
          date: "",
        },
      ]);
      showToast("success", "Successfully sent");
      setLoadingPage(true);
      const res = await axios.get("/api/auth/products");
      setAllProducts(res.data);
    } catch (err) {
      showToast("error", "Failed to send");
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };
  useEffect(() => {
    const selectedProduct = allProducts.find((p) => p.id === sendingRowId);
    if (selectedProduct) {
      setSendForm((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          productName: selectedProduct.productName,
        };
        return updated;
      });
    }
  }, [sendingRowId]);

  const [sentHistory, setSentHistory] = useState([]);
  const [openSentHistory, setOpenSentHistory] = useState(false);
  const [sentProductId, setSentProductId] = useState("");
  const fetchSentHistory = async (productId) => {
    setLoadingPage(true);
    try {
      const res = await axios.get(
        `/api/auth/sendToShop?productId=${productId}`
      );
      setSentHistory(res.data);
      setSentProductId(productId);
      setOpenSentHistory(true);
    } catch (err) {
      console.error("Failed to fetch sales history", err);
    } finally {
      setLoadingPage(false);
    }
  };
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  useEffect(() => {
    if (role === "shop 235") setSelectedShop("shop235");
    if (role === "shop 116") setSelectedShop("shop116");
    if (role === "shop siti") setSelectedShop("shopsiti");
  }, [role]);
  const selectedProduct = allProducts.find((p) => p.id === sellingRowId);

  return (
    <div className={`${styles.mainContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage Shop</h1>
        <div className={styles.topBar}>
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className={styles.categorySelect}
            disabled={role !== "admin"}
          >
            <option value="">Select Shop</option>
            <option value="shop235">Shop 235</option>
            <option value="shop116">Shop 116</option>
            <option value="shopsiti">Shop Siti</option>
          </select>

          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      {openSelling && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sell Product</h3>

            {/* Header for main selected product */}
            {sellingRowId && (
              <div className={styles.purchaseHeader}>
                <h4>Main Product</h4>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <div>
                    <p>
                      <strong>Name:</strong>{" "}
                      {allProducts.find((p) => p.id === sellingRowId)
                        ?.productName || ""}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>In Shop 235:</strong>{" "}
                      {allProducts.find((p) => p.id === sellingRowId)
                        ?.inShop235 || "0"}
                    </p>
                    <p>
                      <strong>In Shop 116:</strong>{" "}
                      {allProducts.find((p) => p.id === sellingRowId)
                        ?.inShop116 || "0"}
                    </p>
                    <p>
                      <strong>In Shop Siti:</strong>{" "}
                      {allProducts.find((p) => p.id === sellingRowId)
                        ?.inShopSiti || "0"}
                    </p>
                  </div>
                  <td>
                    {selectedProduct && selectedShop
                      ? selectedProduct[
                          shopQtyMap[selectedShop]
                        ]?.toLocaleString()
                      : "--"}
                  </td>
                </div>
              </div>
            )}

            {/* Purchase Form for current product */}
            {sellForm.length > 0 &&
              sellForm?.map((form, index) => (
                <form
                  onSubmit={handleSell}
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
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index] = {
                          ...updated[index],
                          productId: selectedProduct?.id,
                          productName: selectedProduct?.productName,
                          sellingPrice: selectedProduct?.sellingPrice,
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
                    value={form.quantitySold}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].quantitySold = value;
                        return updated;
                      });
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={form.customerName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].customerName = value;
                        return updated;
                      });
                    }}
                    required
                  />{" "}
                  <input
                    type="text"
                    placeholder="Customer Phone"
                    value={form.customerPhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].customerPhone = value;
                        return updated;
                      });
                    }}
                    required
                  />
                  {/* <input
                    type="text"
                    placeholder="Plate Number"
                    value={form.plateNo}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].plateNo = value;
                        return updated;
                      });
                    }}
                    required
                  /> */}
                  {/* <input
                    type="text"
                    placeholder="Address"
                    value={form.address}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].address = value;
                        return updated;
                      });
                    }}
                    required
                  /> */}
                  <select
                    name="paymentStatus"
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].paymentStatus = value;
                        return updated;
                      });
                      setPaymentStatus(value);
                    }}
                    required
                  >
                    <option value="">Select payment status</option>
                    <option value="paid">Paid</option>
                    <option value="credit">Credit</option>
                    <option value="partial">Partial</option>
                  </select>
                  {(form.paymentStatus === "paid" ||
                    form.paymentStatus === "partial") && (
                    <>
                      {form.paidWith.length > 0 &&
                        form.paidWith?.map((payment, pIndex) => {
                          const expectedAmount =
                            Number(form.quantitySold) *
                            Number(form.sellingPrice);

                          const additionalPaidSum = form.paidWith
                            .slice(1)
                            .reduce((acc, p) => acc + Number(p.amount || 0), 0);

                          const firstAmount =
                            pIndex === 0
                              ? expectedAmount - additionalPaidSum
                              : payment.amount;

                          return (
                            <div
                              key={pIndex}
                              style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "center",
                              }}
                            >
                              <input
                                list="bank-options"
                                placeholder="Paid With"
                                value={payment.method}
                                onChange={(e) => {
                                  const updated = [...form.paidWith];
                                  updated[pIndex].method = e.target.value;

                                  setSellForm((prev) => {
                                    const newForms = [...prev];
                                    newForms[index].paidWith = updated;
                                    return newForms;
                                  });
                                }}
                              />
                              <datalist id="bank-options">
                                {bankData?.map((bank) => (
                                  <option key={bank.id} value={bank.bankName} />
                                ))}
                              </datalist>

                              {pIndex === 0 &&
                              form.paymentStatus !== "partial" ? (
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
                                <input
                                  type="number"
                                  placeholder="Amount"
                                  min={0}
                                  max={firstAmount}
                                  value={payment.amount}
                                  onChange={(e) => {
                                    let value = Number(e.target.value);
                                    if (value < 0) value = 0;
                                    if (value > expectedAmount)
                                      value = expectedAmount;

                                    const updated = [...form.paidWith];
                                    updated[pIndex].amount = value;

                                    setSellForm((prev) => {
                                      const newForms = [...prev];
                                      newForms[index].paidWith = updated;
                                      return newForms;
                                    });
                                  }}
                                  required
                                />
                              )}

                              {form.paidWith.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = form.paidWith.filter(
                                      (_, i) => i !== pIndex
                                    );
                                    setSellForm((prev) => {
                                      const newForms = [...prev];
                                      newForms[index].paidWith = updated;
                                      return newForms;
                                    });
                                  }}
                                  style={{ color: "red" }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          );
                        })}

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [
                            ...form.paidWith,
                            { method: "", amount: "" },
                          ];
                          setSellForm((prev) => {
                            const newForms = [...prev];
                            newForms[index].paidWith = updated;
                            return newForms;
                          });
                        }}
                        className={styles.editButton}
                      >
                        + Add Payment Method
                      </button>
                    </>
                  )}
                  <select
                    name="saleSource"
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].saleSource = value;
                        return updated;
                      });
                    }}
                    required
                  >
                    <option value="">Select sales source</option>
                    <option value="shop 235">Shop 235</option>
                    <option value="shop 116">Shop 116</option>
                    <option value="shop siti">Shop siti</option>
                  </select>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSellForm((prev) => {
                        const updated = [...prev];
                        updated[index].date = value;
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
                    <button
                      type="submit"
                      className={styles.confirmButton}
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? "#9aa7d9" : "#2563eb",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.9 : 1,
                      }}
                    >
                      Sell
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={() => setOpenSelling(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ))}
            <button
              type="button"
              onClick={() =>
                setSellForm([
                  ...sellForm,
                  {
                    productId: "",
                    productName: "",
                    sellingPrice: "",
                    quantitySold: "",
                    customerName: "",
                    customerPhone: "",
                    plateNo: "",
                    address: "",
                    paymentStatus: "",
                    saleSource: "",
                    paidWith: [{ method: "", amount: "" }],
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
      )}
      {role === "admin" && (
        <div style={{ fontWeight: "900", textAlign: "right", margin: 10 }}>
          Total Selling Price in Shop: {totalValue.toLocaleString() + " ETB"}
        </div>
      )}
      <div className={styles.tableContainer}>
        <table className={`${styles.productTable} ${jura.className} `}>
          <thead style={{ fontWeight: "800", fontSize: "17px" }}>
            <tr>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Selling Price</th>
              <th>Total</th>
              <th>Date</th>
              {role === "admin" && <th></th>}
              <th></th>
              {role === "admin" && <th></th>}
              <th></th>
            </tr>
          </thead>
          <tbody style={{ textAlign: "center" }}>
            {paginatedProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.productName ? product?.productName : "--"}</td>
                <td>
                  {role === "admin"
                    ? selectedShop
                      ? product[shopQtyMap[selectedShop]]?.toLocaleString()
                      : (
                          (product.inShop235 || 0) +
                          (product.inShop116 || 0) +
                          (product.inShopSiti || 0)
                        ).toLocaleString()
                    : product[shopQtyMap[selectedShop]]?.toLocaleString()}
                </td>

                <td>
                  {product.sellingPrice
                    ? product?.sellingPrice.toLocaleString() + " ETB"
                    : "--"}{" "}
                </td>
                <td>
                  {product.sellingPrice
                    ? role === "admin" && !selectedShop
                      ? (
                          product.sellingPrice *
                          ((product.inShop235 || 0) +
                            (product.inShop116 || 0) +
                            (product.inShopSiti || 0))
                        ).toLocaleString() + " ETB"
                      : (
                          product.sellingPrice *
                          (product[shopQtyMap[selectedShop]] || 0)
                        ).toLocaleString() + " ETB"
                    : "--"}
                </td>
                <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                {role === "admin" && (
                  <td>
                    <button
                      className={styles.cancelButton}
                      onClick={() => fetchSalesHistory(product.id)}
                    >
                      Sales History
                    </button>
                  </td>
                )}
                <td>
                  <button
                    className={styles.sellButton}
                    onClick={() => {
                      setSellingRowId(product?.id);
                      setOpenSelling(true);
                    }}
                    disabled={
                      !selectedShop ||
                      (product[shopQtyMap[selectedShop]] || 0) === 0
                    }
                    style={{
                      opacity:
                        !selectedShop ||
                        (product[shopQtyMap[selectedShop]] || 0) === 0
                          ? 0.5
                          : 1,
                      cursor:
                        product.inShop235 === 0 &&
                        product.inShop116 === 0 &&
                        product.inShopSiti === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Sell
                  </button>
                </td>
                {role === "admin" && (
                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => {
                        setOpenSentHistory(true);
                        fetchSentHistory(product?.id);
                      }}
                    >
                      Added History
                    </button>
                  </td>
                )}
                <td>
                  <button
                    className={styles.addButton}
                    onClick={() => {
                      setSendingRowId(product?.id);
                      setOpenSending(true);
                    }}
                    disabled={
                      !selectedShop ||
                      (product[shopQtyMap[selectedShop]] || 0) === 0
                    }
                    style={{
                      opacity:
                        !selectedShop ||
                        (product[shopQtyMap[selectedShop]] || 0) === 0
                          ? 0.5
                          : 1,
                      cursor:
                        product.inShop235 === 0 &&
                        product.inShop116 === 0 &&
                        product.inShopSiti === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    Add From Shop
                  </button>
                </td>
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
      {openSalesHistory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sales History</h3>

            {salesHistory.length === 0 ? (
              <p>{!loadingPage && "No sales history found."}</p>
            ) : (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <select
                    value={selectedShop}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className={styles.categorySelect}
                  >
                    <option value="">All Shops</option>
                    <option value="shop 235">Shop 235</option>
                    <option value="shop 116">Shop 116</option>
                    <option value="shop siti">Shop Siti</option>
                  </select>

                  {/* <button
                    onClick={() => setSelectedSource("shop ")}
                    style={{
                      marginRight: "0.5rem",
                      backgroundColor:
                        selectedSource === "shop" ? "#0070f3" : "#ddd",
                      color: selectedSource === "shop" ? "white" : "black",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Shop Sales
                  </button>
                  <button
                    onClick={() => setSelectedSource("store")}
                    style={{
                      backgroundColor:
                        selectedSource === "store" ? "#0070f3" : "#ddd",
                      color: selectedSource === "store" ? "white" : "black",
                      padding: "0.5rem 1rem",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Store Sales
                  </button> */}
                </div>
                {/* 💾 Filter sales by selectedSource */}
                {(() => {
                  const filteredSales = salesHistory.filter(
                    (sale) => sale.saleSource === selectedSource
                  );
                  const totalSold = filteredSales.reduce(
                    (sum, sale) => sum + sale.quantitySold * sale.sellingPrice,
                    0
                  );

                  return filteredSales.length > 0 ? (
                    <>
                      {role === "admin" && (
                        <p>
                          <strong>Total Sold:</strong>{" "}
                          {totalSold.toLocaleString()} ETB
                        </p>
                      )}
                      <table className={styles.historyTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Phone</th>
                            <th>Plate Number</th>
                            <th>Address</th>
                            <th>Quantity Sold</th>
                            <th>Selling Price</th>
                            <th>Paid With</th>
                            <th>Status</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                              <td>
                                {new Date(sale.date).toLocaleDateString()}
                              </td>
                              <td>{sale.customerName || "--"}</td>
                              <td>{sale.customerPhone || "--"}</td>
                              <td>{sale.plateNo || "--"}</td>
                              <td>{sale.address || "--"}</td>
                              <td>{sale.quantitySold.toLocaleString()}</td>
                              <td>{sale.sellingPrice.toLocaleString()} ETB</td>
                              <td>
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
                              <td
                                style={{
                                  color:
                                    sale.paymentStatus === "credit" ||
                                    sale.paymentStatus === "partial"
                                      ? "red"
                                      : "black",
                                }}
                              >
                                {sale.paymentStatus}
                              </td>
                              <td>
                                {(
                                  sale.quantitySold * sale.sellingPrice
                                ).toLocaleString()}{" "}
                                ETB
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>{" "}
                    </>
                  ) : (
                    <p>{!loadingPage && `No ${selectedSource} sales found.`}</p>
                  );
                })()}{" "}
              </>
            )}
            <button
              type="button"
              onClick={() => {
                setOpenSalesHistory(false);
                setSalesHistory([]);
                setSalesProductId("");
              }}
              className={styles.cancelButton}
            >
              Close
            </button>
            {salesHistory && salesHistory.length > 0 && (
              <button
                onClick={() => downloadSalesPDF(salesHistory, selectedSource)}
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
            )}
          </div>
        </div>
      )}
      {openSending && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Send Products to Shop</h3>

            {/* Header for main selected product */}
            {sendingRowId && (
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
                  </div>
                  {/* <div>
                    <p>
                      <strong>Price:</strong>{" "}
                      {allProducts
                        .find((p) => p.id === seingRowId)
                        ?.sellingPrice.toLocaleString() + " ETB" || ""}
                    </p>
                  </div> */}
                  <div>
                    <p>
                      <strong>Quantity in Shop 116:</strong>{" "}
                      {allProducts.find((p) => p.id === sendingRowId)
                        ?.inStore || "0"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Form for current product */}
            {sendForm.length > 0 &&
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
                          source: selectedProduct?.source,
                          destination: selectedProduct?.destination,
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
                  <select
                    // value={selectedShop}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSendForm((prev) => {
                        const updated = [...prev];
                        updated[index].source = value;
                        return updated;
                      });
                    }}
                    className={styles.categorySelect}
                  >
                    <option value="">Select Shop</option>
                    {role !== "shop 235" && (
                      <option value="shop 235">Shop 235</option>
                    )}
                    {role !== "shop 116" && (
                      <option value="shop 116">Shop 116</option>
                    )}
                    {role !== "shop siti" && (
                      <option value="shop siti">Shop Siti</option>
                    )}
                  </select>
                  <select
                    // value={selectedShop}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSendForm((prev) => {
                        const updated = [...prev];
                        updated[index].destination = value;
                        return updated;
                      });
                    }}
                    className={styles.categorySelect}
                  >
                    <option value="">Select Destination Shop</option>
                    <option value="shop 235">Shop 235</option>
                    <option value="shop 116">Shop 116</option>
                    <option value="shop siti">Shop Siti</option>
                  </select>

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
                    <button
                      type="submit"
                      className={styles.confirmButton}
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? "#9aa7d9" : "#2563eb",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.9 : 1,
                      }}
                    >
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
                    source: "",
                    destination: "",
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
      )}
      {openSentHistory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Sent to Shop History</h3>

            {sentHistory.length === 0 ? (
              <p>{!loadingPage && "No sent to shop history found."}</p>
            ) : (
              <>
                {/* 👈 Add this line */}
                <table className={styles.historyTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Qunatity Sent</th>
                      <th>Source Shop</th>
                      <th>Destination Shop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentHistory.map((sale) => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.date).toLocaleDateString()}</td>
                        <td>{sale.quantitySent.toLocaleString()}</td>
                        <td>{sale.source || "--"}</td>
                        <td>{sale.destination || "--"}</td>
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
            {sentHistory.length > 0 && (
              <button
                onClick={() =>
                  downloadSentHistoryPDF(sentHistory, selectedSource)
                }
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
            )}
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
