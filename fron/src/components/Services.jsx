import React, { useState } from "react";
import { apiRequest } from "../utils/api";
import { IconCheck, IconX, IconEdit, IconTrash } from "./Icons";

function Services({ services, setServices }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
 
   // Pagination State
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;
 
   const [confirmModal, setConfirmModal] = useState({
       show: false,
       title: "",
       message: "",
       onConfirm: null,
       type: 'alert'
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

  /* ADD SERVICE */
  const addService = async () => {
    if (!newName || !newPrice) {
      showAlert("Missing Details", "Please enter both service name and default price.");
      return;
    }

    try {
      const res = await apiRequest("/createService", "POST", {
        name: newName,
        price: Number(newPrice)
      });

      if (res.success) {
        setServices([res.result, ...services]);
        setNewName("");
        setNewPrice("");
        setCurrentPage(1); // Go to first page to see new item
      }
    } catch (error) {
      showAlert("Operation Failed", "Failed to add service: " + error.message);
    }
  };

  /* DELETE MODAL HANDLERS */
  const triggerDeleteModal = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const res = await apiRequest(`/deleteService/${serviceToDelete._id}`, "DELETE");
      if (res.success) {
        setServices(services.filter(s => s._id !== serviceToDelete._id));
        setShowDeleteModal(false);
        setServiceToDelete(null);
      }
    } catch (error) {
      showAlert("Delete Failed", "Failed to delete service: " + error.message);
    }
  };

  /* EDIT SERVICE */
  const startEdit = (service) => {
    setEditingId(service._id);
    setEditName(service.name);
    setEditPrice(service.price);
  };

  const saveEdit = async () => {
    try {
      const res = await apiRequest(`/updateService/${editingId}`, "PUT", {
        name: editName,
        price: Number(editPrice)
      });

      if (res.success) {
        setServices(services.map(s => s._id === editingId ? res.result : s));
        setEditingId(null);
      }
    } catch (error) {
      showAlert("Update Failed", "Failed to update service: " + error.message);
    }
  };

  // Pagination Logic
  const totalItems = services.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = services.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="services-page">
      <div className="services-card">
        <div className="card-header-redux">
          <h2 className="title-medium">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            Manage Services 
            <span className="badge-count">{totalItems}</span>
          </h2>
          <div className="add-service-form-redux">
            <input 
              placeholder="New Service Name" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="srv-name-input"
            />
            <input 
              type="number"
              placeholder="Price" 
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="srv-price-input"
            />
            <button className="add-btn-premium" onClick={addService}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Service
            </button>
          </div>
        </div>


        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ width: "60px" }}>#</th>
                <th style={{ textAlign: 'left', paddingLeft: '30px' }}>SERVICE NAME</th>
                <th style={{ width: "160px", textAlign: 'center' }}>PRICE</th>
                <th style={{ width: "140px", textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>

          <tbody>
            {currentItems.map((s, idx) => (
              <tr key={s._id} className="premium-row">
                <td data-label="#">{idx + 1 + indexOfFirstItem}</td>
                <td data-label="SERVICE" style={{ textAlign: 'center' }}>
                  {editingId === s._id ? (
                    <input 
                      className="edit-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--accent-gold)', color: 'white', padding: '5px 10px', borderRadius: '5px', width: '90%', textAlign: 'center' }}
                    />
                  ) : (
                    s.name
                  )}
                </td>
                <td data-label="PRICE" style={{ textAlign: 'center' }}>
                  {editingId === s._id ? (
                    <input 
                      className="edit-input"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--accent-gold)', color: 'white', padding: '5px 10px', borderRadius: '5px', width: '80%', textAlign: 'center' }}
                    />
                  ) : (
                    `₹ ${s.price}`
                  )}
                </td>
                <td data-label="ACTIONS" className="actions-cell">
                  {editingId === s._id ? (
                    <div className="actions">
                      <button className="action-btn success" title="Save Changes" onClick={saveEdit}><IconCheck size={18} color="#4ade80" /></button>
                      <button className="action-btn delete" title="Cancel" onClick={() => setEditingId(null)}><IconX size={18} color="#fb7185" /></button>
                    </div>
                  ) : (
                    <div className="actions">
                      <button className="action-btn edit" title="Edit" onClick={() => startEdit(s)}><IconEdit size={18} color="#d4af37" /></button>
                      <button className="action-btn delete" title="Delete" onClick={() => triggerDeleteModal(s)}><IconTrash size={18} color="#fb7185" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No services found. Add one above!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


        {/* Pagination Controls */}
        {totalPages > 1 && (
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
        )}

      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to remove <strong>"{serviceToDelete?.name}"</strong> from your services menu? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>Yes, Delete</button>
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
                   
                   <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                       <button 
                           className="add-btn" 
                           style={{ flex: 1, margin: 0, padding: '12px', background: 'var(--accent-gold)', color: 'black', border: 'none', fontWeight: 'bold' }}
                           onClick={confirmModal.onConfirm}
                       >
                           OK
                       </button>
                   </div>
               </div>
           </div>
       )}
     </div>
  );
}

export default Services;
