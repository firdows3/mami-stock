"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import {
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiEdit3,
  FiPlus,
  FiShoppingCart,
  FiTrash,
} from "react-icons/fi";
import { Jura } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Home() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRowId, setEditingRowId] = useState(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [loadingPage, setLoadingPage] = useState(true);
  const [editValues, setEditValues] = useState({
    productName: "",
    inShop235: "",
    inShop116: "",
    inShopSiti: "",
    buyingPrice: "",
    sellingPrice: "",
  });
  // State
  const [selectedShop, setSelectedShop] = useState("all");

  const [isPurchaseMode, setIsPurchaseMode] = useState(false);
  const [purchasingRowId, setPurchasingRowId] = useState("");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [forms, setForms] = useState([
    {
      productName: "",
      inShop235: "",
      inShop116: "",
      inShopSiti: "",
      buyingPrice: "",
      sellingPrice: "",
      paymentStatus: "",
      paidWith: [{ method: "", amount: "" }],
    },
  ]);
  // Start with one form

  const [purchaseForm, setPurchaseForm] = useState([
    {
      productId: "",
      productName: "",
      sellingPrice: "",
      buyingPrice: "",
      quantity: "",
      supplierName: "",
      supplierPhone: "",
      paymentStatus: "",
      paidWith: [
        {
          method: "", // e.g., "Cash", "Bank of Abyssinia", etc.
          amount: "",
        },
      ],
      date: "",
    },
  ]);

  const [paymentStatus, setPaymentStatus] = useState("credit");
  const [previewimg, setPreviewimg] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      if (loading) return;
      setLoading(true);
      setLoadingPage(true);
      try {
        const response = await axios.get("/api/auth/products");
        setAllProducts(response.data);
      } catch (err) {
      } finally {
        setLoading(false);
        setLoadingPage(false);
      }
    }

    fetchProducts();
  }, []);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;

    let shopQty = 0;
    if (selectedShop === "shop235") shopQty = p.inShop235;
    if (selectedShop === "shop116") shopQty = p.inShop116;
    if (selectedShop === "shopsiti") shopQty = p.inShopSiti; // ← add field in DB
    if (selectedShop === "all")
      shopQty = (p.inShop235 || 0) + (p.inShop116 || 0) + (p.inShopSiti || 0);

    return matchesSearch && matchesCategory && shopQty > 0;
  });

  const categories = [
    "all",
    ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
  ];

  const [rowsToShow, setRowsToShow] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * rowsToShow;
  const endIndex = startIndex + rowsToShow;
  const shopQtyMap = {
    "shop 235": "inShop235",
    "shop 116": "inShop116",
    "shop siti": "inShopSiti", // make sure this exists in DB
  };

  const roleFilteredProducts =
    role === "admin"
      ? filteredProducts
      : filteredProducts.filter((p) => {
          const qtyField = shopQtyMap[role];
          if (!qtyField) return false;
          return (p[qtyField] || 0) > 0;
        });

  const paginatedProducts = roleFilteredProducts.slice(startIndex, endIndex);
  const [added, setAdded] = useState("");
  const [bankData, setBankData] = useState([]);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, rowsToShow]);

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

  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setLoadingPage(true);

    try {
      for (let form of forms) {
        const formData = new FormData();

        // Required fields
        formData.append("productName", form.productName);
        formData.append("inShop235", form.inShop235);
        formData.append("inShop116", form.inShop116);
        formData.append("inShopSiti", form.inShopSiti);
        formData.append("buyingPrice", form.buyingPrice);
        formData.append("sellingPrice", form.sellingPrice);
        formData.append("paymentStatus", form.paymentStatus);
        formData.append("paidWith", JSON.stringify(form.paidWith));

        // Optional fields
        if (form.productImage)
          formData.append("productImage", form.productImage); // file
        if (form.productCode) formData.append("productCode", form.productCode);
        if (form.category) formData.append("category", form.category);
        if (form.brand) formData.append("brand", form.brand);
        if (form.unit) formData.append("unit", form.unit);
        if (form.status) formData.append("status", form.status);
        if (form.minStock) formData.append("minStock", form.minStock);
        if (form.maxStock) formData.append("maxStock", form.maxStock);
        if (form.expiredAt) formData.append("expiredAt", form.expiredAt);

        await axios.post("/api/auth/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Reset forms
      setForms([
        {
          productName: "",
          productCode: "",
          productImage: null,
          category: "",
          brand: "",
          unit: "",
          inShop235: 0,
          inShop116: 0,
          inShopSiti: 0,
          buyingPrice: 0,
          sellingPrice: 0,
          status: "active",
          minStock: "",
          maxStock: "",
          expiredAt: "",
          paymentStatus: "paid",
          paidWith: [{ method: "", amount: "" }],
        },
      ]);

      setShowAddForm(false);

      showToast("success", "Product added successfully");

      // Refresh product list
      const res = await axios.get("/api/auth/products");
      setAllProducts(res.data);
    } catch (error) {
      showToast("error", "Failed to add product");
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };

  const [user, setUser] = useState("");
  const [role, setRole] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        setUser(data.username);
        setRole(data.role);
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser("");
        setRole("");
      }
    };

    fetchUser();
  }, [pathname, router]);
  const totalValue = filteredProducts.reduce(
    (acc, curr) => acc + (curr.inShop116 + curr.inShop235 + curr.inShopSiti),
    0
  );

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setLoadingPage(true);
    const formData = new FormData();
    formData.append("productName", editValues?.productName);
    formData.append("id", editingRowId);
    formData.append("inShop235", editValues?.inShop235);
    formData.append("inShop116", editValues?.inShop116);
    formData.append("inShopSiti", editValues?.inShopSiti);
    formData.append("sellingPrice", editValues?.sellingPrice);
    formData.append("buyingPrice", editValues?.buyingPrice);
    formData.append("paymentStatus", paymentStatus);

    formData.append("productCode", editValues?.productCode);
    formData.append("category", editValues?.category);
    formData.append("brand", editValues?.brand);
    formData.append("unit", editValues?.unit);
    formData.append("status", editValues?.status);
    formData.append("minStock", editValues?.minStock);
    formData.append("maxStock", editValues?.maxStock);
    formData.append("expiredAt", editValues?.expiredAt);
    if (editValues?.productImage instanceof File) {
      formData.append("productImage", editValues.productImage);
    }
    try {
      const res = await axios.put("/api/auth/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setIsEditMode(false);
      setEditingRowId(null);
      // Refresh data
      showToast("success", "Product edited successfully");
      const response = await axios.get("/api/auth/products");
      setAllProducts(response.data);
    } catch (err) {
      showToast("error", "Failed to edit product");
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setLoadingPage(true);
    try {
      for (let form of purchaseForm) {
        await axios.post("/api/auth/purchase", {
          productId: purchasingRowId,
          productName: form.productName,
          sellingPrice: Number(form.sellingPrice),
          purchasingPrice: Number(form.buyingPrice),
          quantity: Number(form.quantity),
          supplierName: form.supplierName,
          supplierPhone: form.supplierPhone,
          paidWith: form.paidWith,
          paymentStatus: form.paymentStatus,
          date: form.date,
        });
      }

      showToast("success", "Product purchased successfully");

      setShowPurchaseModal(false);
      setPurchaseForm([
        {
          productId: "",
          productName: "",
          sellingPrice: "",
          buyingPrice: "",
          quantity: "",
          supplierName: "",
          supplierPhone: "",
          paymentStatus: "",
          paidWith: [{ method: "", amount: "" }],
          date: "",
        },
      ]);

      const response = await axios.get("/api/auth/products");
      setAllProducts(response.data);
    } catch (err) {
      showToast("error", "Failed to purchase product");
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };

  const handleDelete = async (e) => {
    if (loading) return;
    setLoading(true);
    setLoadingPage(true);
    try {
      await axios.delete("/api/auth/products", {
        data: { ids: selectedDeleteIds },
      });
      // Optionally refetch data or remove from state
      setSelectedDeleteIds([]);
      setIsDeleteMode(false);
      setShowDeleteModal(false);
      showToast("success", "Product deleted successfully");
      const response = await axios.get("/api/auth/products");
      setAllProducts(response.data);
    } catch (error) {
      showToast("error", "Failed to delete product");
    } finally {
      setLoading(false);
      setLoadingPage(false);
    }
  };
  useEffect(() => {
    const selectedProduct = allProducts.find((p) => p.id === purchasingRowId);
    if (selectedProduct) {
      setPurchaseForm((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          productName: selectedProduct.productName,
        };
        return updated;
      });
    }
  }, [purchasingRowId]);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3000);
  };
  return (
    <div className={`${styles.mainContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Manage Products</h1>
        <div
          className={styles.topBar}
          style={{ display: "flex", gap: "10px", alignItems: "center" }}
        >
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className={styles.categorySelect}
          >
            <option value="all">All Shops</option>
            <option value="shop235">Shop 235</option>
            <option value="shop116">Shop 116</option>
            <option value="shopsiti">Shop Siti</option>
          </select>

          <div className={styles.filterBar}>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

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
            <FiPlus size={16} />
          </button>
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setEditingRowId(null);
            }}
            className={styles.editToggleButton}
          >
            {isEditMode ? (
              <FiCheck size={16} onClick={handleSaveEdit} />
            ) : (
              <FiEdit3 size={16} />
            )}
          </button>
          {isPurchaseMode ? (
            <button
              className={styles.purchaseButton}
              onClick={() => {
                if (purchasingRowId !== "") {
                  setShowPurchaseModal(true);
                }
              }}
            >
              <FiCheck size={16} />
            </button>
          ) : (
            <button
              className={styles.purchaseButton}
              onClick={() => {
                setIsPurchaseMode(!isPurchaseMode);
              }}
            >
              <FiShoppingCart size={16} />
            </button>
          )}

          <button
            className={styles.deleteButton}
            onClick={() => {
              setIsDeleteMode((prev) => !prev);
              setEditingRowId(null); // disable edit
              setPurchasingRowId(""); // disable purchase
              if (isDeleteMode && selectedDeleteIds.length > 0) {
                setShowDeleteModal(true);
              }
            }}
          >
            {isDeleteMode ? <FiCheck /> : <FiTrash />}
          </button>
        </div>
      </div>
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Delete {selectedDeleteIds.length} product(s)?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.confirmButton} onClick={handleDelete}>
                Yes, Delete
              </button>
              <button
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showPurchaseModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Purchase Product</h3>

            {/* Header for main selected product */}
            {purchasingRowId && (
              <div className={styles.purchaseHeader}>
                <h4>Main Product</h4>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <div>
                    <p>
                      <strong>Name:</strong>{" "}
                      {allProducts.find((p) => p.id === purchasingRowId)
                        ?.productName || ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Form for current product */}
            {purchaseForm.map((form, formIndex) => (
              <form
                key={formIndex}
                onSubmit={handlePurchase}
                className={styles.productForm}
              >
                <select
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].productName = e.target.value;
                    setPurchaseForm(updated);
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
                  placeholder="Selling Price"
                  value={purchaseForm.sellingPrice}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].sellingPrice = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                />

                <input
                  type="number"
                  placeholder="Buying Price"
                  value={purchaseForm.buyingPrice}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].buyingPrice = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={purchaseForm.quantity}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].quantity = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                />
                <input
                  type="text"
                  placeholder="Supplier Name"
                  value={purchaseForm.supplierName}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].supplierName = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                />
                <input
                  type="text"
                  placeholder="Supplier Phone"
                  value={purchaseForm.supplierPhone}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].supplierPhone = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                />
                <select
                  name="paymentStatus"
                  value={form.paymentStatus}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].paymentStatus = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                >
                  <option value="">Select payment status</option>
                  <option value="paid">Paid</option>
                  <option value="credit">Credit</option>
                </select>

                {form.paymentStatus === "paid" && (
                  <>
                    {form.paidWith.map((payment, payIndex) => (
                      <div
                        key={payIndex}
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
                            const updated = [...purchaseForm];
                            updated[formIndex].paidWith[payIndex].method =
                              e.target.value;
                            setPurchaseForm(updated);
                          }}
                          required
                        />
                        <datalist id="bank-options">
                          {bankData.map((bank) => (
                            <option key={bank.id} value={bank.bankName} />
                          ))}
                        </datalist>

                        <input
                          type="number"
                          placeholder="Amount"
                          value={payment.amount}
                          onChange={(e) => {
                            const updated = [...purchaseForm];
                            updated[formIndex].paidWith[payIndex].amount =
                              e.target.value;
                            setPurchaseForm(updated);
                          }}
                          required
                        />

                        {form.paidWith.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...purchaseForm];
                              updated[formIndex].paidWith = updated[
                                formIndex
                              ].paidWith.filter((_, i) => i !== payIndex);
                              setPurchaseForm(updated);
                            }}
                            style={{ color: "red" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add new payment method */}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...purchaseForm];
                        updated[formIndex].paidWith.push({
                          method: "",
                          amount: "",
                        });
                        setPurchaseForm(updated);
                      }}
                    >
                      + Add Payment Method
                    </button>
                  </>
                )}
                <input
                  type="date"
                  value={purchaseForm.date}
                  onChange={(e) => {
                    const updated = [...purchaseForm];
                    updated[formIndex].date = e.target.value;
                    setPurchaseForm(updated);
                  }}
                  required
                />

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
                    className={styles.addButton}
                    disabled={loading}
                    style={{
                      borderRadius: "10px",
                      width: 120,
                      backgroundColor: loading ? "#9aa7d9" : "#2563eb",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.9 : 1,
                    }}
                  >
                    Add Purchase
                  </button>
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowPurchaseModal(false)}
                    style={{ borderRadius: "10px" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ))}
            <button
              type="button"
              className={styles.addAnotherButton}
              onClick={() =>
                setPurchaseForm([
                  ...purchaseForm,
                  {
                    productId: "",
                    productName: "",
                    sellingPrice: "",
                    buyingPrice: "",
                    quantity: "",
                    supplierName: "",
                    supplierPhone: "",
                    paymentStatus: "",
                    paidWith: [
                      {
                        method: "", // e.g., "Cash", "Bank of Abyssinia", etc.
                        amount: "",
                      },
                    ],
                    date: "",
                  },
                ])
              }
            >
              Add Another Item
            </button>
          </div>
        </div>
      )}
      {/* <AnimatePresence> */}
      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div
              style={{
                color: "red",
                fontSize: 20,
                float: "right",
                cursor: "pointer",
              }}
              onClick={() => {
                setShowAddForm(false);
                setForms([
                  {
                    productName: "",
                    productCode: "",
                    productImage: "",
                    category: "",
                    brand: "",
                    unit: "",
                    inShop235: 0,
                    inShop116: 0,
                    inShopSiti: 0,
                    buyingPrice: 0,
                    sellingPrice: 0,
                    status: "active",
                    minStock: "",
                    maxStock: "",
                    expiredAt: "",
                    paymentStatus: "paid",
                    paidWith: [{ method: "", amount: "" }],
                  },
                ]);
              }}
            >
              X
            </div>
            <h1 className={styles.pageTitle}>Add New Product</h1>

            {forms.map((form, index) => (
              <div
                key={index}
                style={{ border: "1px solid gray", padding: 20 }}
              >
                {index > 0 && (
                  <div
                    style={{
                      float: "right",
                      cursor: "pointer",
                      color: "red",
                      fontWeight: "bold",
                    }}
                    onClick={() => {
                      const updated = forms.filter((_, i) => i !== index);
                      setForms(updated);
                    }}
                  >
                    X
                  </div>
                )}

                <form
                  key={index}
                  onSubmit={handleSubmit}
                  className={styles.productForm}
                >
                  {/* Image (optional) */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].productImage = e.target.files[0]; // store the file object
                      setForms(updated);
                    }}
                  />
                  {/* Product Name (required) */}
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={form.productName}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].productName = e.target.value;
                      setForms(updated);
                    }}
                    required
                  />
                  {/* Product Code (optional) */}
                  <input
                    type="text"
                    placeholder="Product Code (optional)"
                    value={form.productCode || ""}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].productCode = e.target.value;
                      setForms(updated);
                    }}
                  />
                  {/* Category (required) */}
                  <input
                    type="text"
                    placeholder="Category"
                    value={form.category || ""}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].category = e.target.value;
                      setForms(updated);
                    }}
                    required
                  />
                  {/* Brand (required) */}
                  <input
                    type="text"
                    placeholder="Brand"
                    value={form.brand || ""}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].brand = e.target.value;
                      setForms(updated);
                    }}
                    required
                  />
                  {/* Unit (required) */}
                  <select
                    value={form.unit || ""}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].unit = e.target.value;
                      setForms(updated);
                    }}
                    required
                  >
                    <option>Unit of measurement</option>
                    <option value="pcs">PCs</option>
                    <option value="kg">KG</option>
                    <option value="meter">Meter</option>
                    <option value="liter">Liter</option>
                  </select>
                  {/* Shop & Store Quantity */}
                  <div>
                    <label>In Shop 235: </label>
                    <input
                      type="number"
                      placeholder="Shop 235 Quantity"
                      value={form.inShop235 || 0}
                      onChange={(e) => {
                        const updated = [...forms];
                        updated[index].inShop235 = e.target.value;
                        setForms(updated);
                      }}
                      style={{ width: 100 }}
                    />
                  </div>
                  <div>
                    <label>In Shop 116: </label>
                    <input
                      type="number"
                      placeholder="Shop 116 Quantity"
                      value={form.inShop116 || 0}
                      onChange={(e) => {
                        const updated = [...forms];
                        updated[index].inShop116 = e.target.value;
                        setForms(updated);
                      }}
                      style={{ width: 100 }}
                    />
                  </div>
                  <div>
                    <label>In Shop Siti: </label>
                    <input
                      type="number"
                      placeholder="Shop 116 Quantity"
                      value={form.inShopSiti || 0}
                      onChange={(e) => {
                        const updated = [...forms];
                        updated[index].inShopSiti = e.target.value;
                        setForms(updated);
                      }}
                      style={{ width: 100 }}
                    />
                  </div>
                  {/* Buying & Selling Price */}
                  <div>
                    <label>Buying Price: </label>
                    <input
                      type="number"
                      placeholder="Buying Price"
                      value={form.buyingPrice || 0}
                      onChange={(e) => {
                        const updated = [...forms];
                        updated[index].buyingPrice = e.target.value;
                        setForms(updated);
                      }}
                      style={{ width: 100 }}
                    />
                  </div>
                  <div>
                    <label>Selling Price: </label>
                    <input
                      type="number"
                      placeholder="Selling Price"
                      value={form.sellingPrice || 0}
                      onChange={(e) => {
                        const updated = [...forms];
                        updated[index].sellingPrice = e.target.value;
                        setForms(updated);
                      }}
                      style={{ width: 100 }}
                    />
                  </div>
                  {/* Status (optional) */}
                  <select
                    value={form.status || "active"}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].status = e.target.value;
                      setForms(updated);
                    }}
                  >
                    <option>Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  {/* Min & Max Stock (optional) */}
                  <input
                    type="number"
                    placeholder="Min Stock (optional)"
                    value={form.minStock || ""}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].minStock = e.target.value;
                      setForms(updated);
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Max Stock (optional)"
                    value={form.maxStock || ""}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].maxStock = e.target.value;
                      setForms(updated);
                    }}
                  />{" "}
                  <div>
                    <label>Expiry Date: </label>
                    <input
                      type="date"
                      placeholder="Expiry date (optional)"
                      value={form.expiredAt || ""}
                      onChange={(e) => {
                        const updated = [...forms];
                        updated[index].expiredAt = e.target.value;
                        setForms(updated);
                      }}
                    />
                  </div>
                  {/* Payment Status & Paid With */}
                  <select
                    value={form.paymentStatus || "paid"}
                    onChange={(e) => {
                      const updated = [...forms];
                      updated[index].paymentStatus = e.target.value;
                      setForms(updated);
                    }}
                  >
                    <option value="paid">Paid</option>
                    <option value="credit">Credit</option>
                  </select>
                  {form.paymentStatus === "paid" &&
                    form.paidWith.map((payment, pIndex) => (
                      <div
                        key={pIndex}
                        style={{ display: "flex", gap: "10px" }}
                      >
                        <input
                          list="bank-options"
                          placeholder="Paid With"
                          value={payment.method}
                          onChange={(e) => {
                            const updated = [...forms];
                            updated[index].paidWith[pIndex].method =
                              e.target.value;
                            setForms(updated);
                          }}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={payment.amount}
                          onChange={(e) => {
                            const updated = [...forms];
                            updated[index].paidWith[pIndex].amount =
                              e.target.value;
                            setForms(updated);
                          }}
                          required
                        />
                      </div>
                    ))}
                  <button
                    className={styles.addButton}
                    disabled={loading}
                    style={{
                      backgroundColor: loading ? "#9aa7d9" : "#2563eb",
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    Add
                  </button>
                </form>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setForms([
                  ...forms,
                  {
                    productName: "",
                    productCode: "",
                    productImage: "",
                    category: "",
                    brand: "",
                    unit: "",
                    inShop235: 0,
                    inShop116: 0,
                    inShopSiti: 0,
                    buyingPrice: 0,
                    sellingPrice: 0,
                    status: "active",
                    minStock: "",
                    maxStock: "",
                    expiredAt: "",
                    paymentStatus: "paid",
                    paidWith: [{ method: "", amount: "" }],
                  },
                ])
              }
              className={styles.purchaseButton}
              style={{ marginTop: 10 }}
            >
              Add Another Item
            </button>
          </div>
        </div>
      )}
      {/* </AnimatePresence> */}
      <div style={{ fontWeight: "900", textAlign: "right", margin: 10 }}>
        Total items in Stock: {totalValue.toLocaleString() + " Items"}
      </div>
      <div className={styles.tableContainer}>
        {allProducts.length > 0 && (
          <table className={`${styles.productTable} ${jura.className}`}>
            <thead style={{ fontWeight: "800", fontSize: "17px" }}>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Unit</th>
                {role === "admin" && (
                  <>
                    <th>Original Quantity</th>
                    <th>Stock Status</th>
                  </>
                )}
                <th>Quantity</th>
                {role === "admin" && <th>Buying Price</th>}
                {role === "admin" && <th>Selling Price</th>}
              </tr>
            </thead>
            <tbody style={{ textAlign: "center" }}>
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => {
                    if (isEditMode && editingRowId !== product.id) {
                      setEditingRowId(product.id);
                      setEditValues({
                        productName: product.productName,
                        inShop235: product.inShop235,
                        inShop116: product.inShop116,
                        inShopSiti: product.inShopSiti,
                        buyingPrice: product.buyingPrice,
                        sellingPrice: product.sellingPrice,
                        productCode: product.productCode || "",
                        category: product.category || "",
                        brand: product.brand || "",
                        unit: product.unit || "",
                        status: product.status || "active",
                        minStock: product.minStock || 0,
                        maxStock: product.maxStock || 0,
                        expiredAt: product.expiredAt || "",
                      });
                    } else if (
                      isPurchaseMode &&
                      purchasingRowId !== product.id
                    ) {
                      setPurchasingRowId(product.id);
                    } else if (isDeleteMode) {
                      setSelectedDeleteIds((prev) =>
                        prev.includes(product.id)
                          ? prev.filter((id) => id !== product.id)
                          : [...prev, product.id]
                      );
                    }
                  }}
                  style={{
                    cursor:
                      isEditMode || isPurchaseMode || isDeleteMode
                        ? "pointer"
                        : "default",
                    backgroundColor:
                      editingRowId === product.id ||
                      purchasingRowId === product.id ||
                      selectedDeleteIds.includes(product.id)
                        ? "#e0f7ff"
                        : "transparent",
                    border:
                      editingRowId === product.id ||
                      purchasingRowId === product.id ||
                      selectedDeleteIds.includes(product.id)
                        ? "2px solid #0070f3"
                        : "none",
                  }}
                >
                  {/* Image */}
                  <td>
                    {product.productImage ? (
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                      />
                    ) : (
                      "--"
                    )}
                  </td>

                  {/* Product Name */}
                  <td>
                    {editingRowId === product.id ? (
                      <input
                        value={editValues.productName}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            productName: e.target.value,
                          }))
                        }
                        className={styles.editInput}
                      />
                    ) : (
                      product.productName
                    )}
                  </td>

                  {/* Product Code */}
                  <td>
                    {editingRowId === product.id ? (
                      <input
                        value={editValues.productCode}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            productCode: e.target.value,
                          }))
                        }
                        className={styles.editInput}
                      />
                    ) : (
                      product.productCode || "--"
                    )}
                  </td>

                  {/* Category */}
                  <td>
                    {editingRowId === product.id ? (
                      <input
                        value={editValues.category}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className={styles.editInput}
                      />
                    ) : (
                      product.category || "--"
                    )}
                  </td>

                  {/* Brand */}
                  <td>
                    {editingRowId === product.id ? (
                      <input
                        value={editValues.brand}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            brand: e.target.value,
                          }))
                        }
                        className={styles.editInput}
                      />
                    ) : (
                      product.brand || "--"
                    )}
                  </td>

                  {/* Unit */}
                  <td>
                    {editingRowId === product.id ? (
                      <input
                        value={editValues.unit}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            unit: e.target.value,
                          }))
                        }
                        className={styles.editInput}
                      />
                    ) : (
                      product.unit || "--"
                    )}
                  </td>
                  {role === "admin" && <td>{product.orgQty || "--"}</td>}

                  {/* Min Stock */}
                  {role === "admin" && (
                    <td>
                      {(() => {
                        const totalStock =
                          (product.inShop235 || 0) +
                          (product.inShop116 || 0) +
                          (product.inShopSiti || 0);

                        if (totalStock === 0) {
                          return (
                            <span className="stock out">Out of Stock</span>
                          );
                        }
                        if (totalStock < product.minStock) {
                          return <span className="stock low">Low Stock</span>;
                        }
                        if (totalStock > product.maxStock) {
                          return <span className="stock over">Overstock</span>;
                        }
                        return <span className="stock normal">Normal</span>;
                      })()}
                    </td>
                  )}

                  <td>
                    {selectedShop === "shop235" ||
                      (role === "shop 235" && product.inShop235)}
                    {selectedShop === "shop116" ||
                      (role === "shop 116" && product.inShop116)}
                    {selectedShop === "shopsiti" ||
                      (role === "shop siti" && product.inShopSiti)}
                    {selectedShop === "all" &&
                      product.inShop235 +
                        product.inShop116 +
                        (product.inShopSiti || 0)}
                  </td>

                  {/* Total Buying Price */}
                  {role === "admin" && (
                    <td>
                      {product.inShop235 &&
                      product.inShop116 &&
                      product.inShopSiti
                        ? (
                            (product.inShop235 +
                              product.inShop116 +
                              product.inShopSiti) *
                            product.buyingPrice
                          ).toLocaleString() + " ETB"
                        : "--"}
                    </td>
                  )}
                  {/* Total Selling Price */}
                  {role === "admin" && (
                    <td>
                      {(product.inShop235 ||
                        product.inShop116 ||
                        product.inShopSiti) &&
                      product.sellingPrice
                        ? (
                            (product.inShop235 +
                              product.inShop116 +
                              product.inShopSiti) *
                            product.sellingPrice
                          ).toLocaleString() + " ETB"
                        : "--"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
