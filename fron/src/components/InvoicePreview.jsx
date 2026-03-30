import React from "react";
import { logoBase64 } from "../utils/logoData";

function InvoicePreview({ invoice, close }) {

    if (!invoice) return null;

    return (

        <div className="invoice-modal-overlay">

            <div className="invoice-modal-content luxury-preview">

                {/* CLOSE BUTTON */}
                <button className="close-preview-btn" onClick={close}>×</button>

                {/* 1. TRIPLE BAND HEADER (EXACT 1:1 REPLICA) */}
                <div className="preview-triple-header">
                    
                    {/* Band 1: Deep Black Top */}
                    <div className="band-1-black">
                        <div className="preview-logo-circle">
                             <img src={logoBase64} alt="Studio Logo" />
                        </div>
                        <h2 className="preview-studio-name">DH MAKEUP STUDIO & ACADEMY</h2>
                    </div>

                    {/* Band 2: Pure White Service Bar */}
                    <div className="band-2-white">
                        <p>Make Up  |  Hair Style  |  Hair Removal  |  Skin Treatment  |  All Beauty Care</p>
                    </div>

                    {/* Band 3: Dark Contact Footer */}
                    <div className="band-3-black">
                        <p className="p-addr">H-101, First Floor, Shivant Iconic, Outer Ringroad, Valak, Surat. | +91 95373 87311</p>
                        <p className="p-social">Instagram: dh_makeup_studio_</p>
                    </div>

                </div>

                {/* 2. CUSTOMER & METADATA GRID */}
                <div className="preview-customer-block">
                    
                    <div className="cust-left">
                        <h1 className="cust-title">{(invoice.customerName || "Customer").toUpperCase()}</h1>
                        <p className="cust-phone">+91 {invoice.mobileNumber || invoice.mobile || ""}</p>
                    </div>

                    <div className="cust-right">
                        <p className="meta-line"><span>Date :</span> {invoice.date || (invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'))}</p>
                        {(() => {
                            const rawId = (invoice.invoiceId || (invoice.id ? String(invoice.id) : (invoice._id ? invoice._id.toString().slice(-2).toUpperCase() : "01")));
                            const displayId = (rawId.replace("INV-", "")).padStart(2, "0");
                            return <p className="meta-line"><span>Invoice No :</span> {displayId}</p>;
                        })()}
                    </div>

                </div>

                {/* 3. LUXURY ZEBRA TABLE */}
                <div className="preview-items-table">
                    
                    <table className="luxury-table-core">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="t-center">Qty.</th>
                                <th className="t-center">Price</th>
                                <th className="t-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, i) => (
                                <tr key={i} className={i % 2 !== 0 ? "zebra-row" : ""}>
                                    <td>{item.name}</td>
                                    <td className="t-center">{item.qty}</td>
                                    <td className="t-center">Rs. {Number(item.price).toFixed(2)}</td>
                                    <td className="t-center t-bold">Rs. {(item.qty * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>

                {/* 4. TOTALS SECTION */}
                <div className="preview-totals-block">
                    
                    <div className="totals-calc">
                        <p className="sub-line">Sub-total : <span>Rs. {Number(invoice.total).toFixed(2)}</span></p>
                        <p className="sub-line">Tax : <span>Rs. 0.00</span></p>
                        
                        <div className="final-total-box">
                            <p className="total-label">Total :</p>
                            <p className="total-value">Rs. {Number(invoice.total).toFixed(2)}</p>
                        </div>
                    </div>

                </div>

                {/* 5. FOOTER & SIGNATURE */}
                <div className="preview-footer-block">
                    
                    <div className="footer-sign">
                        <div className="sign-line"></div>
                        <h3>DH MAKEUP STUDIO & ACADEMY</h3>
                        <p>Authorized Signatory</p>
                    </div>

                    <div className="footer-thanks">
                        <p>Thank you for visiting DH Makeup Studio & Academy. We hope to see you again!</p>
                    </div>

                </div>

            </div>

        </div>

    )

}

export default InvoicePreview;