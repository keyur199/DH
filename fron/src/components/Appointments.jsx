import React, { useState, useEffect } from "react";
import { generateInvoice } from "../utils/generateInvoice";
import CustomDropdown from "./CustomDropdown";
import { apiRequest } from "../utils/api";
import { IconClipboard, IconEdit, IconTrash } from "./Icons";

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
        status: "Pending"
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
      alert("Failed to book appointment: " + (error.message || "Unknown error"));
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  /* COMPLETE APPOINTMENT (Links Invoice) */
  const completeAppointment = async (id) => {
    const appnt = appointments.find(a => a._id === id);
    if (!appnt) return;
    try {
      const invoiceData = {
        customerName: appnt.customerName,
        mobileNumber: appnt.mobileNumber,
        services: appnt.services,
        date: appnt.date, // Pass the scheduled date
        appointmentId: id
      };
      const invRes = await apiRequest("/createInvoice", "POST", invoiceData);
      if (invRes.success) {
        await apiRequest(`/updateAppointment/${id}`, "PUT", { status: "Completed" });
        fetchAppointments();
      }
    } catch (error) {
      showAlert("Operation Failed", "Failed to complete appointment: " + error.message);
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
            console.error("Revert error:", err);
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
  const [editServices, setEditServices] = useState([]);

  const triggerEditModal = (a) => {
    setAppointmentToEdit(a);
    setEditCustomer(a.customerName);
    setEditMobile(a.mobileNumber);
    setEditDate(a.date);
    setEditTime(a.time);
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
        <h2>Appointment Booking</h2>
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
        </div>

        <div className="services-section">
          <h4>Services</h4>
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
                placeholder="Price"
                value={s.price}
                onChange={(e) => updateServiceRow(i, "price", e.target.value)}
              />
              <button className="remove-btn" onClick={() => removeServiceRow(i)}>Remove</button>
            </div>
          ))}
          <button className="add-btn" onClick={addServiceRow}>Add Service</button>
        </div>

        <button className="book-btn" onClick={bookAppointment}>Book Appointment</button>
      </div>

      <div className="table-card appointments-card glass-card mt-25" style={{ padding: '20px' }}>
        <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 className="title-small" style={{ margin: 0 }}><span className="icon-gold">📋</span> Latest Appointments</h3>
          
          <div className="table-filters" style={{ display: 'flex', gap: '12px' }}>
            <div className="filter-item">
              <input 
                type="text" 
                placeholder="Search by Name/Mobile..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  width: '200px'
                }}
              />
            </div>
            <div className="filter-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: '600' }}>DATE:</span>
              <input 
                type="date" 
                value={searchDate} 
                onChange={(e) => setSearchDate(e.target.value)}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', 
                  padding: '6px 10px', 
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}
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
        <div className="table-wrapper">
          <table className="premium-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '15%' }}>CUSTOMER</th>
                <th style={{ width: '12%' }}>MOBILE</th>
                <th style={{ width: '22%' }}>SERVICES</th>
                <th style={{ width: '11%' }}>DATE</th>
                <th style={{ width: '10%' }}>TIME</th>
                <th style={{ width: '12%' }} className="centered-cell">STATUS</th>
                <th style={{ width: '13%' }} className="centered-cell">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {appointments
                .filter(a => {
                  const matchesDate = searchDate ? a.date === searchDate : true;
                  const matchesSearch = searchTerm ? (
                    (a.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                    String(a.mobileNumber || "").includes(searchTerm)
                  ) : true;
                  return matchesDate && matchesSearch;
                })
                .length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No matching appointments found.</td></tr>
              ) : (
                appointments
                  .filter(a => {
                    const matchesDate = searchDate ? a.date === searchDate : true;
                    const matchesSearch = searchTerm ? (
                      (a.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                      String(a.mobileNumber || "").includes(searchTerm)
                    ) : true;
                    return matchesDate && matchesSearch;
                  })
                  .map((a, idx) => (
                  <tr key={a._id} className="premium-row">
                    <td style={{ opacity: '0.6', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-gold)', textAlign: 'center' }}>{a.customerName}</td>
                    <td style={{ letterSpacing: '0.5px', fontSize: '0.9rem', textAlign: 'center' }}>{a.mobileNumber}</td>
                    <td
                      title={a.services?.map(s => s.name).join(", ")}
                      style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}
                    >
                      {a.services?.map(s => s.name).join(", ")}
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: '0.85rem', textAlign: 'center' }}>{a.date}</td>
                    <td style={{ whiteSpace: "nowrap", fontSize: '0.85rem' }}>{formatTime(a.time)}</td>
                    <td className="centered-cell">
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
                            className="status-btn pending"
                            title="Click to mark as Completed"
                            onClick={() => completeAppointment(a._id)}
                            onMouseOver={(e) => { e.target.innerText = 'Complete'; }}
                            onMouseOut={(e) => { e.target.innerText = 'Pending'; }}
                          >Pending</button>
                        )}
                      </div>
                    </td>
                    <td className="actions" style={{ textAlign: 'center' }}>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
          <div className="confirm-modal" style={{ maxWidth: '500px' }}>
            <h3>Edit Appointment</h3>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '15px', marginTop: '20px' }}>
              <input
                placeholder="Customer Name"
                value={editCustomer}
                onChange={(e) => setEditCustomer(e.target.value)}
              />
              <input
                placeholder="Mobile Number"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>

            {/* SERVICES SECTION FOR EDIT MODAL */}
            <div className="services-section-modal" style={{ 
              marginTop: '25px', 
              padding: '20px', 
              background: 'rgba(255,255,255,0.02)', 
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h4 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
                  <span style={{ fontSize: '1.2rem' }}>📋</span> SELECT SERVICES
                </h4>
                <button
                  className="add-service-mini"
                  onClick={() => setEditServices([...editServices, { name: "", price: "" }])}
                  style={{
                    background: 'rgba(74, 222, 128, 0.08)',
                    color: '#4ade80',
                    border: '1px solid rgba(74, 222, 128, 0.2)',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)'; }}
                >
                  + Add More
                </button>
              </div>

              <div className="services-scroll-area" style={{ 
                maxHeight: '220px', 
                overflowY: 'auto', 
                paddingRight: '6px',
                paddingBottom: '80px' // Extra space for dropdown to open without clipping
              }}>
                {editServices.map((s, i) => (
                  <div key={i} className="service-edit-row" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 40px',
                    gap: '12px',
                    marginBottom: '12px',
                    alignItems: 'center',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <div className="input-group-modal">
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
                    <div className="price-input-modal" style={{ position: 'relative' }}>
                      <input
                        type="number"
                        placeholder="Price"
                        value={s.price}
                        onChange={(e) => {
                          const updated = [...editServices];
                          updated[i].price = e.target.value;
                          setEditServices(updated);
                        }}
                        style={{
                          width: '100%',
                          height: '48px',
                          borderRadius: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--accent-gold)',
                          padding: '0 8px',
                          fontSize: '1rem',
                          textAlign: 'center',
                          fontWeight: '600',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <button
                      className="remove-btn-modal"
                      title="Remove Row"
                      style={{
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        background: 'rgba(251, 113, 133, 0.08)',
                        color: '#fb7185',
                        border: '1px solid rgba(251, 113, 133, 0.2)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(251, 113, 133, 0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(251, 113, 133, 0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
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

            <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', gap: '15px' }}>
              <button className="cancel-btn" style={{ flex: 1, height: '48px' }} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="book-btn" style={{ flex: 2, height: '48px', margin: 0 }} onClick={saveEdit}>Save Changes</button>
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