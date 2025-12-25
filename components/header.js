"use client";
import Link from "next/link";
import "./styles/header.css";
import { usePathname, useRouter } from "next/navigation";
import {
  MdInventory,
  MdAttachMoney,
  MdMoneyOff,
  MdWarningAmber,
  MdDashboard,
  MdStore,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
} from "react-icons/md";
import {
  FaShoppingCart,
  FaCreditCard,
  FaUniversity,
  FaStore,
  FaUsers,
  FaBook,
  FaArrowDown,
  FaArrowUp,
  FaUser,
} from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";
import { FiLogOut, FiMenu } from "react-icons/fi";
import { Jura } from "next/font/google";
import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export default function Header() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState("");
  const [role, setRole] = useState("");
  const router = useRouter();
  const [openLogout, setOpenLogout] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        setAuthenticated(data.authenticated);

        if (data.authenticated) {
          setUser(data.username);
          setRole(data.role);

          // Redirect logic for role-based index
          if (pathname === "/") {
            if (data.role === "shopper") router.replace("/shop");
            if (data.role === "storekeeper") router.replace("/storeSales");
          }
        } else {
          setUser("");
          setRole("");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setAuthenticated(false);
        setUser("");
        setRole("");
      }
    };

    fetchUser();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      router.push("/login");
      setOpenLogout(false);
      setUser("");
      setRole("");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };
  const [openProduct, setOpenProduct] = useState(false);
  const [openSales, setOpenSales] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);

  if (!authenticated) return null; // No header if not logged in

  return (
    <div>
      <div
        style={{
          position: "fixed",
          // backgroundColor: "#fff",
          // width: "100%",
          padding: "5px 0px",
          // display: "flex",
          // justifyContent: "space-between",
          // alignItems: "center",
          zIndex: 1500,
          // top: 55,
        }}
      >
        <div
          className="menu-icon"
          onClick={() => setOpenMenu(!openMenu)}
          style={{ cursor: "pointer" }}
        >
          {openMenu ? (
            <div style={{ color: "black", fontSize: 20 }}>X</div>
          ) : (
            <FiMenu style={{ color: "black", fontSize: 30 }} />
          )}
        </div>

        {/* <div style={{ color: "#000" }}>User: {user}</div> */}
      </div>

      <div
        className={`${jura.className} ${
          openMenu ? "header-container visible-header" : "header-container"
        }`}
      >
        <div className="user-profile">
          <div className="user-avatar">
            <FaUser />
          </div>
          <div className="user-name">{user}</div>
        </div>

        <div className="header">
          {/* Admin full menu */}
          {role === "admin" && (
            <>
              <Link
                className={`header-link ${
                  pathname === "/"
                    ? // ||
                      // pathname === "/shop" ||
                      // pathname === "/store"
                      "active-link"
                    : ""
                }`}
                href="/"
                onClick={() => setOpenMenu(false)}
              >
                {/* <MdInventory />  */}
                Product
              </Link>
              {/* <div className="product-menu">
                <div
                  className="dropdown-toggle"
                  onClick={() => setOpenProduct(!openProduct)}
                  style={{ fontSize: "20px" }}
                >
                  {openProduct ? (
                    <MdKeyboardArrowUp />
                  ) : (
                    <MdKeyboardArrowDown />
                  )}
                </div>
              </div> */}
              <Link
                className={`header-link ${
                  pathname === "/shop" ? "active-link" : ""
                }`}
                href="/shop"
                onClick={() => {
                  setOpenProduct(false);
                  setOpenMenu(false);
                }}
              >
                Shop
              </Link>
              {/* {openProduct && (
                <div className="dropdown">

                  <Link
                    className={`header-link dropdown-link ${
                      pathname === "/store" ? "active-link" : ""
                    }`}
                    href="/store"
                    onClick={() => {
                      setOpenProduct(false);
                      setOpenMenu(false);
                    }}
                  >
                    Store
                  </Link>
                </div>
              )} */}
              <div className="product-menu">
                <Link
                  className={`header-link ${
                    pathname === "/sales" ? "active-link" : ""
                  }`}
                  href="/sales"
                  onClick={() => setOpenMenu(false)}
                >
                  Sales
                </Link>
                {/* <div
                  className="dropdown-toggle"
                  onClick={() => setOpenSales(!openSales)}
                  style={{ fontSize: "20px" }}
                >
                  {openSales ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                </div> */}
              </div>
              {/* {openSales && (
                <div className="dropdown">
                  <Link
                    className={`header-link dropdown-link ${
                      pathname === "/sales" ? "active-link" : ""
                    }`}
                    href="/sales"
                    onClick={() => setOpenMenu(false)}
                  >
                    Shop
                  </Link>
                  <Link
                    className={`header-link dropdown-link ${
                      pathname === "/storeSales" ? "active-link" : ""
                    }`}
                    href="/storeSales"
                    onClick={() => setOpenMenu(false)}
                  >
                    Store
                  </Link>
                </div>
              )} */}
              {/* <Link
                className={`header-link ${
                  pathname === "/sentToShop" ? "active-link" : ""
                }`}
                href="/sentToShop"
                onClick={() => setOpenMenu(false)}
              >
                Send To Shop
              </Link> */}
              <Link
                className={`header-link ${
                  pathname === "/purchases" ? "active-link" : ""
                }`}
                href="/purchases"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaCreditCard />  */}
                Purchases
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/credits" ? "active-link" : ""
                }`}
                href="/credits"
                onClick={() => setOpenMenu(false)}
              >
                {/* <MdAttachMoney />  */}
                Credits
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/expenses" ? "active-link" : ""
                }`}
                href="/expenses"
                onClick={() => setOpenMenu(false)}
              >
                {/* <MdMoneyOff />  */}
                Expenses
              </Link>
              <div className="product-menu">
                <div
                  className={`header-link ${
                    pathname === "/expired" ||
                    pathname === "/lowStock" ||
                    pathname === "/overStock"
                      ? "active-link"
                      : ""
                  }`}
                  //   pathname === "/sales" ? "active-link" : ""
                  // }`}
                  // href="/sales"
                  // onClick={() => setOpenMenu(false)}
                >
                  {/* <FaShoppingCart />  */}
                  <MdWarningAmber /> Alert
                </div>
                <div
                  className="dropdown-toggle"
                  onClick={() => setOpenAlert(!openAlert)}
                  style={{ fontSize: "20px" }}
                >
                  {openAlert ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
                </div>
              </div>
              {openAlert && (
                <div className="dropdown">
                  <Link
                    className={`header-link dropdown-link ${
                      pathname === "/lowStock" ? "active-link" : ""
                    }`}
                    href="/lowStock"
                    onClick={() => setOpenMenu(false)}
                  >
                    {/* <FaShoppingCart />  */}
                    Low Stock
                  </Link>
                  <Link
                    className={`header-link dropdown-link ${
                      pathname === "/overStock" ? "active-link" : ""
                    }`}
                    href="/overStock"
                    onClick={() => setOpenMenu(false)}
                  >
                    {/* <FaShoppingCart />  */}
                    Over Stock
                  </Link>
                  <Link
                    className={`header-link dropdown-link ${
                      pathname === "/expired" ? "active-link" : ""
                    }`}
                    href="/expired"
                    onClick={() => setOpenMenu(false)}
                  >
                    {/* <FaShoppingCart />  */}
                    Expired
                  </Link>
                </div>
              )}
              <Link
                className={`header-link ${
                  pathname === "/bankInfo" ? "active-link" : ""
                }`}
                href="/bankInfo"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaUniversity />  */}
                Bank Information
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/customerSupplier" ? "active-link" : ""
                }`}
                href="/customerSupplier"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaUniversity />  */}
                Customer & Supplier
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/cashbook" ? "active-link" : ""
                }`}
                href="/cashbook"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaBook />  */}
                My cash book
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/dashboard" ? "active-link" : ""
                }`}
                href="/dashboard"
                onClick={() => setOpenMenu(false)}
              >
                {/* <MdDashboard />  */}
                Dashboard
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/users" ? "active-link" : ""
                }`}
                href="/users"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaUsers />  */}
                Manage Users
              </Link>
            </>
          )}

          {/* Shopper menu */}
          {role === "shopper" && (
            <>
              <Link
                className={`header-link ${
                  pathname === "/shop" ? "active-link" : ""
                }`}
                href="/shop"
                onClick={() => setOpenMenu(false)}
              >
                {/* <MdStore />  */}
                Shop
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/sales" ? "active-link" : ""
                }`}
                href="/sales"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaShoppingCart />  */}
                Sales
              </Link>
            </>
          )}

          {/* Storekeeper menu */}
          {role === "storekeeper" && (
            <>
              <Link
                className={`header-link ${
                  pathname === "/storeSales" ? "active-link" : ""
                }`}
                href="/storeSales"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaShoppingCart />  */}
                Store Sales
              </Link>
              <Link
                className={`header-link ${
                  pathname === "/sentToShop" ? "active-link" : ""
                }`}
                href="/sentToShop"
                onClick={() => setOpenMenu(false)}
              >
                {/* <FaShoppingCart /> <HiArrowRight />  */}
                Send To Shop
              </Link>
            </>
          )}
          {/* Logout */}
          <div
            className="header-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              cursor: "pointer",
            }}
            onClick={() => setOpenLogout(true)}
          >
            <FiLogOut style={{ fontSize: 20 }} /> Log Out
          </div>

          {openLogout && (
            <div className="modalOverlay">
              <div className="modalContent">
                <MdWarningAmber size={48} color="orange" />
                <p>Are you sure you want to logout?</p>
                <div className="modalActions">
                  <button onClick={handleLogout} className="confirmButton">
                    Yes
                  </button>
                  <button
                    onClick={() => setOpenLogout(false)}
                    className="cancelButton"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="header-top">
          <img src="/logo.png" alt="logo" />
          <Link
            href="https://amidos-nine.vercel.app/"
            target="_blank"
            style={{ color: "#666", fontSize: "15px", textAlign: "center" }}
          >
            AMIDOS Security and Software Solutions
          </Link>
        </div>
      </div>
    </div>
  );
}
