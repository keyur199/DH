import React, { useState, useEffect } from "react";
import { generateInvoice } from "../utils/generateInvoice";
import CustomDropdown from "./CustomDropdown";
import { apiRequest } from "../utils/api";
import { IconClipboard, IconEdit, IconTrash, IconWhatsApp } from "./Icons";
import { sendWhatsApp } from "../utils/generateInvoice";

function Appointments({
  appointments,
  setAppointments,
  setInvoices,
  setCustomers,
  services,
  setServices
}) {

  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [serviceList, setServiceList] = useState([
    { name: "", price: "" }
  ]);

  // Fetch Appointments from Backend on load
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await apiRequest("/getAllAppointments");
      if (res.success) {
        setAppointments(res.result);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    }
  };

  /* TIME FORMAT (Strict 12h AM/PM) */
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hour, minute] = timeStr.split(":").map(Number);
      const h12 = hour % 12 || 12;
      const ampm = hour >= 12 ? "PM" : "AM";
      return `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  /* ADD SERVICE ROW */
  const addServiceRow = () => {
    setServiceList([...serviceList, { name: "", price: "" }]);
  };

  /* UPDATE SERVICE ROW */
  const updateServiceRow = (i, field, value) => {
    const updated = [...serviceList];
    updated[i][field] = value;
    setServiceList(updated);
  };

  /* REMOVE SERVICE ROW */
  const removeServiceRow = (i) => {
    const updated = serviceList.filter((_, index) => index !== i);
    setServiceList(updated);
  };

  /* BOOK APPOINTMENT */
  const bookAppointment = async () => {
    if (!customer || !mobile || !date || !time) {
      showAlert("Missing Details", "Please fill all details (Customer, Mobile, Date, Time)");
      return;
    }

    // Validate and format services
    const formattedServices = serviceList.map(s => ({
      name: s.name.trim(),
      price: Number(s.price) || 0
    })).filter(s => s.name !== "");

    if (formattedServices.length === 0) {
      showAlert("No Services Selected", "Please select at least one service before booking");
      return;
    }

    try {
      const res = await apiRequest("/createAppointment", "POST", {
        customerName: customer,
        mobileNumber: mobile,
        date,
        time,
        services: formattedServices,
        status: "Pending",
        paymentMethod: paymentMethod
      });

      if (res.success) {
        setAppointments([res.result, ...appointments]);
        setCustomer("");
        setMobile("");
        setDate("");
        setTime("");
        setServiceList([{ name: "", price: "" }]);
      }
    } catch (error) {
      showAlert("Booking Failed", "Failed to book appointment: " + (error.message || "Unknown error"));
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const [statusLoadingId, setStatusLoadingId] = useState(null);

  /* COMPLETE APPOINTMENT (Links Invoice) */
  const completeAppointment = async (id) => {
    if (statusLoadingId === id) return;
    const appnt = appointments.find(a => a._id === id);
    if (!appnt) return;
    
    setStatusLoadingId(id);
    try {
      const invoiceData = {
        customerName: appnt.customerName,
        mobileNumber: appnt.mobileNumber,
        services: appnt.services,
        date: appnt.date, // Pass the scheduled date
        appointmentId: id,
        paymentMethod: appnt.paymentMethod || "Cash"
      };
      
      const invRes = await apiRequest("/createInvoice", "POST", invoiceData);
      if (invRes.success) {
        await apiRequest(`/updateAppointment/${id}`, "PUT", { status: "Completed" });
        await fetchAppointments();
      }
    } catch (error) {
      showAlert("Operation Failed", "Failed to complete appointment: " + error.message);
    } finally {
      setStatusLoadingId(null);
    }
  };

  /* REVERT TO PENDING (Deletes Invoice) */
  const revertToPending = async (id) => {
    showConfirm(
      "Revert Appointment?",
      "Are you sure you want to revert this to Pending? The associated invoice will be deleted automatically.",
      async () => {
        try {
          const res = await apiRequest(`/revertToPending/${id}`, "PUT");
          if (res.success) {
            setAppointments(appointments.map(a => a._id === id ? res.result : a));
            // Also update invoices list if needed (it will be missing now)
            setInvoices(prev => prev.filter(inv => inv.appointmentId !== id));
          }
        } catch (err) {
          showAlert("Revert Failed", "Failed to revert appointment: " + err.message);
        }
      }
    );
  };

  /* DELETE MODAL TRIGGERS */
  const triggerDeleteModal = (a) => {
    setAppointmentToDelete(a);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;
    try {
      const res = await apiRequest(`/deleteAppointment/${appointmentToDelete._id}`, "DELETE");
      if (res.success) {
        fetchAppointments();
        setShowDeleteModal(false);
      }
    } catch (error) {
      showAlert("Delete Failed", "Failed to delete appointment: " + error.message);
    }
  };

  const [searchDate, setSearchDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    type: 'confirm' // 'confirm' or 'alert'
  });

  const showAlert = (title, message) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false })),
      type: 'alert'
    });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type: 'confirm'
    });
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("Cash");
  const [editServices, setEditServices] = useState([]);

  const triggerEditModal = (a) => {
    setAppointmentToEdit(a);
    setEditCustomer(a.customerName);
    setEditMobile(a.mobileNumber);
    setEditDate(a.date);
    setEditTime(a.time);
    setEditPaymentMethod(a.paymentMethod || "Cash");
    // Deep clone to avoid direct state mutation
    setEditServices(a.services ? a.services.map(s => ({ ...s })) : []);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    try {
      // Validate and format services before saving
      const formattedServices = editServices.map(s => ({
        name: s.name?.trim() || "",
        price: Number(s.price) || 0
      })).filter(s => s.name !== "");

      if (formattedServices.length === 0) {
        showAlert("Validation Error", "Please select at least one service before saving edits.");
        return;
      }

      const res = await apiRequest(`/updateAppointment/${appointmentToEdit._id}`, "PUT", {
        customerName: editCustomer,
        mobileNumber: editMobile,
        date: editDate,
        time: editTime,
        paymentMethod: editPaymentMethod,
        services: formattedServices
      });
      if (res.success) {
        fetchAppointments();
        setShowEditModal(false);
      }
    } catch (e) {
      showAlert("Edit Failed", "The update could not be saved: " + e.message);
    }
  };

  return (
    <div className="appointments-page">
      <div className="booking-card">
        <h2 className="title-medium" style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Appointment Booking
        </h2>

        <div className="form-grid">
          <input
            placeholder="Customer Name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
          <input
            placeholder="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <div className="form-group-boutique" style={{ flex: 1.2 }}>
            <label className="boutique-label" style={{ marginBottom: '8px', display: 'block' }}>PAYMENT METHOD</label>
            <div className="payment-toggle-boutique">
              <button 
                className={`payment-btn-boutique ${paymentMethod === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                💵 Cash
              </button>
              <button 
                className={`payment-btn-boutique ${paymentMethod === 'Online' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Online')}
              >
                💳 Online
              </button>
            </div>
          </div>
        </div>

        <div className="services-section">
          <h4>Services Selection</h4>
          <div className="service-header-row">
            <span className="col-srv">Service</span>
            <span className="col-prc">Price</span>
            <span className="col-act">Action</span>
          </div>
          {serviceList.map((s, i) => (

            <div key={i} className="service-row">
              <div className="input-group">
                <CustomDropdown
                  services={services}
                  setServices={setServices}
                  value={s.name}
                  onChange={(val) => {
                    const selected = services.find(srv => srv.name === val);
                    const updated = [...serviceList];
                    updated[i].name = val;
                    if (selected) {
                      updated[i].price = selected.price;
                    }
                    setServiceList(updated);
                  }}
                />
              </div>
              <input
                type="number"
                className="price-input"
                placeholder="Price"
                value={s.price}
                onChange={(e) => updateServiceRow(i, "price", e.target.value)}
              />

              <button className="delete-btn-premium" onClick={() => removeServiceRow(i)} title="Remove Service">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>

            </div>
          ))}
          <button className="add-service-btn-premium" onClick={addServiceRow}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Service
          </button>

        </div>

        <button className="book-btn" onClick={bookAppointment}>Book Appointment</button>
      </div>

      <div className="table-card appointments-card glass-card mt-25" style={{ padding: '20px' }}>
        <div className="table-header-row appointments-header-mobile">
          <h3 className="title-small appointments-title-mobile">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            Latest Appointments
          </h3>


          <div className="table-filters appointments-filters-mobile">
            <div className="filter-item search-filter">
              <input
                type="text"
                placeholder="Search by Name/Mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="boutique-input-search"
              />
            </div>
            <div className="filter-item date-filter">
              <span className="date-label-boutique">DATE:</span>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="boutique-input-date"
              />
              {searchDate && (
                <button
                  onClick={() => setSearchDate("")}
                  style={{ background: 'transparent', border: 'none', color: '#fb7185', cursor: 'pointer', fontSize: '0.8rem' }}
                >✕</button>
              )}
            </div>
          </div>
        </div>
        <div className="table-container">
          <table className="premium-table">

            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="col-idx">#</th>
                <th className="col-cust">CUSTOMER</th>
                <th className="col-mobi">MOBILE</th>
                <th className="col-serv">SERVICES</th>
                <th className="col-date">DATE</th>
                <th className="col-time">TIME</th>
                <th className="col-pay">PAYMENT</th>
                <th className="col-stat centered-cell">STATUS</th>
                <th className="col-acts centered-cell">ACTIONS</th>
              </tr>

            </thead>
            <tbody>
              {(() => {
                const filtered = appointments.filter(a => {
                  const matchesDate = searchDate ? a.date === searchDate : true;
                  const matchesSearch = searchTerm ? (
                    (a.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                    String(a.mobileNumber || "").includes(searchTerm)
                  ) : true;
                  return matchesDate && matchesSearch;
                });

                const totalItems = filtered.length;
                const totalPages = Math.ceil(totalItems / itemsPerPage);
                const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                if (currentItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                        No matching appointments found.
                      </td>
                    </tr>
                  );
                }

                return currentItems.map((a, idx) => (
                  <tr key={a._id} className="premium-row">
                    <td data-label="#" style={{ opacity: '0.6', textAlign: 'center' }}><span>{(currentPage - 1) * itemsPerPage + idx + 1}</span></td>
                    <td data-label="CUSTOMER" style={{ fontWeight: '600', color: 'var(--accent-gold)', textAlign: 'center' }}><span>{a.customerName}</span></td>
                    <td data-label="MOBILE" style={{ letterSpacing: '0.5px', fontSize: '0.9rem', textAlign: 'center' }}><span>{a.mobileNumber}</span></td>
                    <td data-label="SERVICES"
                      title={a.services?.map(s => s.name).join(", ")}
                      style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}
                    >
                      <span>{a.services?.map(s => s.name).join(", ")}</span>
                    </td>
                    <td data-label="DATE" style={{ whiteSpace: "nowrap", fontSize: '0.85rem', textAlign: 'center' }}><span>{a.date}</span></td>
                    <td data-label="TIME" style={{ whiteSpace: "nowrap", fontSize: '0.85rem' }}><span>{formatTime(a.time)}</span></td>
                    <td data-label="PAYMENT" style={{ textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '700', 
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        background: a.paymentMethod === 'Online' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                        color: a.paymentMethod === 'Online' ? '#60a5fa' : 'var(--accent-gold)',
                        border: `1px solid ${a.paymentMethod === 'Online' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(212, 175, 55, 0.2)'}`
                      }}>
                        {a.paymentMethod === 'Online' ? '💳 Online' : '💵 Cash'}
                      </span>
                    </td>
                    <td data-label="STATUS" className="centered-cell">
                      <div className="status-wrapper">
                        {a.status === "Completed" ? (
                          <button
                            className="status-btn success"
                            title="Click to revert to Pending (Delete Invoice)"
                            onClick={() => revertToPending(a._id)}
                            onMouseOver={(e) => { e.target.innerText = 'Revert'; }}
                            onMouseOut={(e) => { e.target.innerText = 'Completed'; }}
                          >Completed</button>
                        ) : (
                          <button
                            className={`status-btn pending ${statusLoadingId === a._id ? 'loading' : ''}`}
                            disabled={statusLoadingId === a._id}
                            title="Click to mark as Completed"
                            onClick={() => completeAppointment(a._id)}
                            onMouseOver={(e) => { if (statusLoadingId !== a._id) e.target.innerText = 'Complete'; }}
                            onMouseOut={(e) => { if (statusLoadingId !== a._id) e.target.innerText = 'Pending'; }}
                          >
                            {statusLoadingId === a._id ? '⏳ Billing...' : 'Pending'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td data-label="ACTIONS" className="actions-cell">
                      <div className="actions">
                        <button
                          className="action-btn edit"
                          title="Edit Appointment"
                          onClick={() => triggerEditModal(a)}
                        >
                          <IconEdit size={18} color="#d4af37" />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete Appointment"
                          onClick={() => triggerDeleteModal(a)}
                        >
                          <IconTrash size={18} color="#fb7185" />
                        </button>
                        {a.status === "Completed" && (
                          <button
                            className="action-btn whatsapp"
                            title="Send WhatsApp Invoice"
                            onClick={() => sendWhatsApp(a)}
                          >
                            <IconWhatsApp size={18} color="#4ade80" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {(() => {
          const filtered = appointments.filter(a => {
            const matchesDate = searchDate ? a.date === searchDate : true;
            const matchesSearch = searchTerm ? (
              (a.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
              String(a.mobileNumber || "").includes(searchTerm)
            ) : true;
            return matchesDate && matchesSearch;
          });
          const totalPages = Math.ceil(filtered.length / itemsPerPage);

          if (totalPages > 1) {
            return (
              <div className="pagination-wrapper">
                <button
                  className="page-btn mobile-compact"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  PREV
                </button>
                <div className="page-info">
                  <span>{currentPage}</span> of {totalPages}
                </div>
                <button
                  className="page-btn mobile-compact"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  NEXT
                </button>
              </div>

            );
          }
          return null;
        })()}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Delete Appointment?</h3>
            <p>Are you sure you want to remove <strong>{appointmentToDelete?.customerName}</strong>'s booking? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="confirm-modal boutique-modal-edit">
            <h3 className="modal-title-boutique">Edit Appointment</h3>
            
            <div className="boutique-form-grid">
              <div className="form-group-boutique">
                <label className="boutique-label">CUSTOMER NAME</label>
                <input
                  className="boutique-input"
                  placeholder="Enter name..."
                  value={editCustomer}
                  onChange={(e) => setEditCustomer(e.target.value)}
                />
              </div>

              <div className="form-group-boutique">
                <label className="boutique-label">MOBILE NUMBER</label>
                <input
                  className="boutique-input"
                  placeholder="Enter number..."
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                />
              </div>

              <div className="boutique-dual-row">
                <div className="form-group-boutique flex-1">
                  <label className="boutique-label">DATE</label>
                  <input
                    className="boutique-input"
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
                <div className="form-group-boutique flex-1">
                  <label className="boutique-label">TIME</label>
                  <input
                    className="boutique-input"
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                  />
                </div>
                <div className="form-group-boutique" style={{ flex: 1.4 }}>
                  <label className="boutique-label">PAYMENT METHOD</label>
                  <div className="payment-toggle-boutique">
                    <button 
                      className={`payment-btn-boutique ${editPaymentMethod === 'Cash' ? 'active' : ''}`}
                      onClick={() => setEditPaymentMethod('Cash')}
                    >
                      💵 Cash
                    </button>
                    <button 
                      className={`payment-btn-boutique ${editPaymentMethod === 'Online' ? 'active' : ''}`}
                      onClick={() => setEditPaymentMethod('Online')}
                    >
                      💳 Online
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SERVICES SECTION FOR EDIT MODAL */}
            <div className="services-section-boutique">
              <div className="services-header-boutique">
                <h4 className="services-title-boutique">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                  SELECT SERVICES
                </h4>

                <button
                  className="add-service-mini-boutique"
                  onClick={() => setEditServices([...editServices, { name: "", price: "" }])}
                >
                  + Add More
                </button>
              </div>

              <div className="services-scroll-area-boutique">
                {editServices.map((s, i) => (
                  <div key={i} className="service-edit-row-boutique">
                    <div className="dropdown-wrapper-boutique">
                      <CustomDropdown
                        services={services}
                        setServices={setServices}
                        value={s.name}
                        onChange={(val) => {
                          const selected = services.find(srv => srv.name === val);
                          const updated = [...editServices];
                          updated[i].name = val;
                          if (selected) {
                            updated[i].price = selected.price;
                          }
                          setEditServices(updated);
                        }}
                      />
                    </div>
                    <div className="price-wrapper-boutique">
                      <input
                        type="number"
                        className="boutique-price-input"
                        placeholder="Price"
                        value={s.price}
                        onChange={(e) => {
                          const updated = [...editServices];
                          updated[i].price = e.target.value;
                          setEditServices(updated);
                        }}
                      />
                    </div>


                    <button
                      className="remove-service-btn-boutique"
                      title="Remove"
                      onClick={() => {
                        const updated = editServices.filter((_, idx) => idx !== i);
                        setEditServices(updated);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="boutique-modal-footer">
              <button className="boutique-cancel-btn" onClick={() => setShowEditModal(false)}>CANCEL</button>
              <button className="boutique-save-btn" onClick={saveEdit}>SAVE CHANGES</button>
            </div>
          </div>
        </div>
      )}

      {/* GENERIC CONFIRMATION / ALERT MODAL */}
      {confirmModal.show && (
        <div className="modal-overlay" style={{ zIndex: 300000 }}>
          <div className="confirm-modal animate-in" style={{ maxWidth: '400px' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '15px' }}>{confirmModal.title}</h3>
            <p style={{ color: 'white', opacity: 0.8, marginBottom: '25px', lineHeight: '1.5' }}>{confirmModal.message}</p>

            <div style={{ display: 'flex', gap: '12px' }}>
              {confirmModal.type === 'confirm' && (
                <button
                  className="cancel-btn"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                >
                  Cancel
                </button>
              )}
              <button
                className="book-btn"
                style={{ flex: 1, margin: 0, padding: '12px', background: 'var(--accent-gold)', color: 'black' }}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;