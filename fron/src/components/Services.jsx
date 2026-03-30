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

  /* ADD SERVICE */
  const addService = async () => {
    if (!newName || !newPrice) {
      alert("Please enter both name and price");
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
      alert("Failed to add service: " + error.message);
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
      alert("Failed to delete service: " + error.message);
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
      alert("Failed to update service: " + error.message);
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
        <div className="card-header">
           <h2>Manage Services <span className="badge-count" style={{ fontSize: '1rem', background: 'var(--accent-gold)', color: '#000', padding: '2px 10px', borderRadius: '20px', marginLeft: '10px' }}>{totalItems}</span></h2>
          <div className="add-service-form">
            <input 
              placeholder="New Service Name" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input 
              type="number"
              placeholder="Default Price" 
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
            <button className="add-btn" onClick={addService}>Add Service</button>
          </div>
        </div>

        <table className="premium-table">
          <thead>
            <tr>
              <th style={{ width: "40px" }}>#</th>
              <th style={{ textAlign: 'center' }}>SERVICE NAME</th>
              <th style={{ width: "120px", textAlign: 'center' }}>PRICE</th>
              <th className="centered-cell" style={{ width: "130px", textAlign: 'center !important' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((s, idx) => (
              <tr key={s._id} className="premium-row">
                <td>{idx + 1 + indexOfFirstItem}</td>
                <td style={{ textAlign: 'center' }}>
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
                <td style={{ textAlign: 'center' }}>
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
                <td className="actions" style={{ textAlign: 'center' }}>
                  {editingId === s._id ? (
                    <div className="actions">
                      <button className="action-btn success" title="Save Changes" onClick={saveEdit}><IconCheck size={18} color="#4ade80" /></button>
                      <button className="action-btn delete" title="Cancel" onClick={() => setEditingId(null)}><IconX size={18} color="#fb7185" /></button>
                    </div>
                  ) : (
                    <>
                      <button className="action-btn edit" title="Edit" onClick={() => startEdit(s)}><IconEdit size={18} color="#d4af37" /></button>
                      <button className="action-btn delete" title="Delete" onClick={() => triggerDeleteModal(s)}><IconTrash size={18} color="#fb7185" /></button>
                    </>
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="pagination-wrapper" style={{ marginTop: '20px' }}>
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
    </div>
  );
}

export default Services;
