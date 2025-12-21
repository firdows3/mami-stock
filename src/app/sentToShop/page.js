"use client";
import { useEffect, useState } from "react";
import styles from "../page.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Jura } from "next/font/google";
import axios from "axios";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});

export default function Shop() {
  const [allProducts, setAllProducts] = useState([]);
  const [sellingRowId, setSellingRowId] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [sellForm, setSellForm] = useState([
    {
      productId: "",
      productName: "",
      sellingPrice: "",
      quantitySold: "",
      customerName: "",
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
  const filteredProducts = allProducts.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  );
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

  const [quantityError, setQuantityError] = useState("");
  const [amountError, setAmountError] = useState("");

  const totalValue = filteredProducts.reduce(
    (acc, curr) => acc + curr.inShop * curr.sellingPrice,
    0
  );

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

  useEffect(() => {
    const fetchSentHistory = async () => {
      setLoadingPage(true);
      try {
        const res = await axios.get("/api/auth/sendToShop");
        setSentHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch sales history", err);
      } finally {
        setLoadingPage(false);
      }
    };
    fetchSentHistory();
  }, []);

  return (
    <div className={`${styles.mainContent} ${jura.className}`}>
      <div className={styles.home_top}>
        <h1 className={styles.pageTitle}>Send to Shop</h1>
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
      {/* {role === "admin" && (
        <div style={{ fontWeight: "900", textAlign: "right", margin: 10 }}>
          Total Selling Price in Shop: {totalValue.toLocaleString() + " ETB"}
        </div>
      )} */}
      {sentHistory.length === 0 ? (
        <p style={{ textAlign: "center", fontSize: 20, marginTop: 20 }}>
          {!loadingPage && " No product sent yet."}
        </p>
      ) : (
        <div className={styles.tableContainer}>
          {/* 👈 Add this line */}
          <table className={`${styles.productTable} ${jura.className} `}>
            <thead style={{ fontWeight: "800", fontSize: "17px" }}>
              <tr>
                <th>Date</th>
                <th>Product Name</th>
                <th>Qunatity Sent</th>
              </tr>
            </thead>
            <tbody>
              {sentHistory.map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{sale.productName}</td>
                  <td>{sale.quantitySent.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}{" "}
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
