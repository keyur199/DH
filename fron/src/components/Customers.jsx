import React, { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

function Customers() {
    const [search, setSearch] = useState("");
    const [customerList, setCustomerList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await apiRequest("/getCustomersDashboard");
            if (res.success) {
                setCustomerList(res.result);
            }
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered list based on search
    const filteredList = customerList.filter(c =>
        c.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        String(c.mobileNumber)?.includes(search)
    );

    // Pagination Logic
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

    // Reset pagination on search
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="customers-page animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Customers <span className="badge-count">{totalItems}</span></h2>
                <input
                    className="search-box"
                    style={{ margin: 0, width: '300px' }}
                    placeholder="Search name or mobile..."
                    value={search}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="table-card customers-card" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customers...</div>
                ) : (
                    <>
                        <table className="premium-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                                    <th style={{ width: '25%', textAlign: 'center' }}>CUSTOMER NAME</th>
                                    <th style={{ width: '25%', textAlign: 'center' }}>MOBILE</th>
                                    <th style={{ width: '20%', textAlign: 'center' }}>VISITS</th>
                                    <th style={{ width: '25%', textAlign: 'center' }}>TOTAL SPENT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((c, i) => (
                                    <tr key={i} className="premium-row">
                                        <td style={{ textAlign: 'center', opacity: 0.6 }}>{i + 1 + indexOfFirstItem}</td>
                                        <td style={{ fontWeight: '500', color: 'var(--accent-gold)', textAlign: 'center' }}>{c.customerName || "N/A"}</td>
                                        <td style={{ textAlign: 'center' }}>{c.mobileNumber}</td>
                                        <td style={{ textAlign: 'center' }}>{c.totalVisits}</td>
                                        <td style={{ fontWeight: '600', color: 'var(--accent-gold)', textAlign: 'center' }}>₹{c.totalSpent}</td>
                                    </tr>
                                ))}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination-wrapper">
                                <button 
                                    className="page-btn" 
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    Previous
                                </button>
                                <div className="page-info">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button 
                                    className="page-btn" 
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Customers;