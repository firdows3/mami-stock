import "./styles/footer.css";
import { Jura } from "next/font/google";
const jura = Jura({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose what you need
  display: "swap",
});
export default function Footer() {
  return (
    <div className={`${jura.className} footer`}>
      {/* <div style={{ fontSize: 15, padding: 10 }}>
        ©Copyright AMIDOS{" "}
        <span style={{ fontSize: 11 }}>Security and Software Solutions. </span>{" "}
        All Rights Reserved
      </div>
      <div>Contact Us: 0921347410</div> */}
    </div>
  );
}
