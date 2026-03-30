import React, { useState, useEffect, useRef } from "react";
import { apiRequest } from "../utils/api";

function CustomDropdown({ services, setServices, value, onChange, placeholder = "Select Service" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "add", "edit", "delete"
  const [modalData, setModalData] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [inputPrice, setInputPrice] = useState("0");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openModal = (type, data = null) => {
    setModalType(type);
    setModalData(data);
    if (type === "add") {
      setInputValue("");
      setInputPrice("0");
    } else if (type === "edit") {
      setInputValue(data.name);
      setInputPrice(data.price.toString());
    }
    setShowModal(true);
    setIsOpen(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    setInputValue("");
  };

  const handleModalSubmit = async () => {
    if (modalType === "add" || modalType === "edit") {
      if (!inputValue.trim()) return;
      
      if (modalType === "add") {
        const exists = services.find(s => s.name.toLowerCase() === inputValue.toLowerCase());
        if (exists) {
          alert("This service already exists!");
          return;
        }
        try {
          const res = await apiRequest("/createService", "POST", { name: inputValue, price: Number(inputPrice) || 0 });
          if (res.success) {
            setServices([res.result, ...services]);
            onChange(res.result.name);
          }
        } catch (error) {
          console.error("Failed to add service:", error);
        }
      } else if (modalType === "edit") {
        try {
          const res = await apiRequest(`/updateService/${modalData._id}`, "PUT", { 
              name: inputValue,
              price: Number(inputPrice) || 0 
          });
          if (res.success) {
            setServices(services.map(s => s._id === modalData._id ? res.result : s));
            if (value === modalData.name) onChange(inputValue);
          }
        } catch (error) {
          console.error("Failed to edit service:", error);
        }
      }
    } else if (modalType === "delete") {
      try {
        const res = await apiRequest(`/deleteService/${modalData._id}`, "DELETE");
        if (res.success) {
          setServices(services.filter(s => s._id !== modalData._id));
          if (value === modalData.name) onChange("");
        }
      } catch (error) {
        console.error("Failed to delete service:", error);
      }
    }
    closeModal();
  };

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div className={`dropdown-selected ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {value || placeholder}
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-list">
          {services.map((srv, index) => (
            <div key={index} className="dropdown-item" onClick={() => { onChange(srv.name); setIsOpen(false); }}>
              <span className="srv-name">{srv.name}</span>
              <div className="srv-actions">
                <button 
                  className="srv-edit-btn" 
                  title="Edit"
                  onClick={(e) => { e.stopPropagation(); openModal("edit", srv); }}
                >
                  ✎
                </button>
                <button 
                  className="srv-delete-btn" 
                  title="Delete"
                  onClick={(e) => { e.stopPropagation(); openModal("delete", srv); }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div className="dropdown-item add-new" onClick={() => openModal("add")}>
            Add New Service...
          </div>
        </div>
      )}

      {/* CUSTOM MODAL FOR ADD/EDIT/DELETE */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 200000 }}>
          <div className="confirm-modal" style={{ textAlign: 'left', maxWidth: '400px' }}>
            <h3 style={{ color: 'var(--accent-gold)', marginBottom: '20px' }}>
              {modalType === "add" ? "✨ Add New Service" : modalType === "edit" ? "✎ Edit Service" : "🗑️ Delete Service"}
            </h3>
            
            {(modalType === "add" || modalType === "edit") ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>SERVICE NAME</label>
                  <input
                    placeholder="e.g. Hair Cut"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '10px' }}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>DEFAULT PRICE (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={inputPrice}
                    onChange={(e) => setInputPrice(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '10px' }}
                  />
                </div>
              </div>
            ) : (
              <p style={{ color: 'white', opacity: 0.8 }}>
                Are you sure you want to delete <strong>{modalData?.name}</strong> from the service menu?
              </p>
            )}

            <div className="modal-actions" style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
              <button 
                className="cancel-btn" 
                style={{ flex: 1, padding: '12px' }} 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="book-btn" 
                style={{ 
                  flex: 1, 
                  margin: 0, 
                  padding: '12px', 
                  background: modalType === "delete" ? 'var(--accent-red)' : 'var(--accent-gold)',
                  color: modalType === "delete" ? 'white' : 'black'
                }} 
                onClick={handleModalSubmit}
              >
                {modalType === "delete" ? "Delete" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;
