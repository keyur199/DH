import React, { useState, useEffect } from "react";
import { downloadPDF, sendWhatsApp } from "../utils/generateInvoice";
import { apiRequest } from "../utils/api";
import { IconPDF, IconWhatsApp, IconTrash } from "./Icons";

function InvoiceHistory({ invoices, setInvoices }) {

    const [search, setSearch] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    /* LOAD DATA FROM BACKEND */
    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await apiRequest("/getAllInvoices");
            if (res.success) {
                setInvoices(res.result);
            }
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        }
    };

    /* TRIGGER DELETE MODAL */
    const triggerDeleteModal = (inv) => {
        setInvoiceToDelete(inv);
        setShowDeleteModal(true);
    };

    /* CONFIRM DELETE */
    const confirmDelete = async () => {
        if (!invoiceToDelete) return;

        try {
            const res = await apiRequest(`/deleteInvoice/${invoiceToDelete._id}`, "DELETE");
            if (res.success) {
                setInvoices(prev => prev.filter(i => i._id !== invoiceToDelete._id));
                setShowDeleteModal(false);
                setInvoiceToDelete(null);
            }
        } catch (error) {
            alert("Failed to delete invoice: " + error.message);
        }
    };

    // Filter logic
    const filteredInvoices = invoices.filter(inv =>
        (inv.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
        String(inv.mobileNumber || inv.mobile || "").includes(search)
    );

    // Pagination Logic
    const totalItems = filteredInvoices.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

    // Search reset
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="history-page">
            <div className="dashboard-header-redux">
                <h2 className="page-title">
                    Invoice History 
                    <span className="badge-count">{totalItems}</span>
                </h2>
                <div className="dashboard-filters-wrapper">
                    <input
                        className="search-box"
                        placeholder="Search name or mobile..."
                        value={search}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>


            <div className="table-container history-container">
                <table className="premium-table">

                    <thead>
                        <tr>
                            <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                            <th style={{ width: '12%', textAlign: 'center' }}>INVOICE</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>CUSTOMER</th>
                            <th style={{ width: '12%', textAlign: 'center' }}>MOBILE</th>
                            <th style={{ width: '22%', textAlign: 'center' }}>SERVICES</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>DATE</th>
                            <th style={{ width: '8%', textAlign: 'center' }}>TOTAL</th>
                            <th className="centered-cell" style={{ width: '11%', textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((inv, idx) => {
                            if (!inv) return null;
                            return (
                            <tr key={inv._id || idx} className="premium-row">
                                <td data-label="#" style={{ textAlign: 'center' }}>{idx + 1 + indexOfFirstItem}</td>
                                <td data-label="INV ID" style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', textAlign: 'center' }}>{inv.invoiceId || `#${(inv._id || "********").substring(0, 8)}`}</td>
                                <td data-label="CUSTOMER" style={{ fontWeight: '500', textAlign: 'center' }}>{inv.customerName}</td>
                                <td data-label="MOBILE" style={{ textAlign: 'center' }}>{inv.mobileNumber || inv.mobile}</td>
                                <td data-label="SERVICES"
                                    title={(inv.services || inv.items)?.filter(i => i && i.name).map(i => i.name).join(", ") || "No services"}
                                    style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}
                                >
                                    {(inv.services || inv.items)?.filter(i => i && i.name).map(i => i.name).join(", ") || "No services"}
                                </td>
                                <td data-label="DATE" style={{ textAlign: 'center' }}>{inv.date || (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-GB') : "N/A")}</td>
                                <td data-label="AMOUNT" style={{ fontWeight: '600', color: 'var(--accent-gold)', textAlign: 'center' }}>₹{inv.totalAmount ?? inv.total ?? 0}</td>
                                <td data-label="ACTIONS" className="actions-cell">
                                    <div className="actions">
                                        <button className="action-btn" title="Download PDF" onClick={() => downloadPDF(inv)}>
                                            <IconPDF size={18} color="#60a5fa" />
                                        </button>
                                        <button className="action-btn" title="Send WhatsApp" onClick={() => sendWhatsApp(inv)}>
                                            <IconWhatsApp size={18} color="#4ade80" />
                                        </button>
                                        <button className="action-btn" title="Delete Invoice" onClick={() => triggerDeleteModal(inv)}>
                                            <IconTrash size={18} color="#fb7185" />
                                        </button>
                                    </div>
                                </td>

                            </tr>
                            );
                        })}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="pagination-wrapper">
                        <button 
                            className="page-btn mobile-compact" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            Prev
                        </button>
                        <div className="page-info">
                            Page <span>{currentPage}</span> of <span>{totalPages}</span>
                        </div>
                        <button 
                            className="page-btn mobile-compact" 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}

            </div>

            {/* CUSTOM DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="confirm-modal">
                        <h3>Confirm Invoice Deletion</h3>
                        <p>Are you sure you want to delete the invoice for <strong>"{invoiceToDelete?.customerName}"</strong>? This will remove it from the history permanently.</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="confirm-delete-btn" onClick={confirmDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InvoiceHistory;
