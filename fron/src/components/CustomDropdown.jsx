import React, { useState, useEffect, useRef } from "react";
import { apiRequest } from "../utils/api";

function CustomDropdown({ services, setServices, value, onChange, placeholder = "Select Service" }) {

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* CLOSE ON OUTSIDE CLICK */

  useEffect(() => {

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);

  }, []);

  /* HANDLERS */

  const handleAddNew = async () => {
    const newName = window.prompt("Enter New Service Name:");
    if (newName) {
      const exists = services.find(s => s.name.toLowerCase() === newName.toLowerCase());
      if (exists) {
        alert("This service already exists!");
        onChange(exists.name);
        setIsOpen(false);
        return;
      }

      const newPriceStr = window.prompt("Enter Default Price:", "0");
      const newPrice = Number(newPriceStr) || 0;

      try {
        const res = await apiRequest("/createService", "POST", { name: newName, price: newPrice });
        if (res.success) {
          setServices([res.result, ...services]);
          onChange(res.result.name);
        }
      } catch (error) {
        console.error("Failed to add service:", error);
      }
    }
    setIsOpen(false);
  };

  const handleDelete = async (e, service) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${service.name}" from menu?`)) {
      try {
        const res = await apiRequest(`/deleteService/${service._id}`, "DELETE");
        if (res.success) {
          setServices(services.filter(s => s._id !== service._id));
          if (value === service.name) onChange("");
        }
      } catch (error) {
        console.error("Failed to delete service:", error);
      }
    }
  };

  const handleEdit = async (e, service) => {
    e.stopPropagation();
    const newName = window.prompt("Edit Service Name:", service.name);
    if (newName && newName !== service.name) {
      try {
        const res = await apiRequest(`/updateService/${service._id}`, "PUT", { 
            name: newName,
            price: service.price 
        });
        if (res.success) {
          setServices(services.map(s => s._id === service._id ? res.result : s));
          if (value === service.name) onChange(newName);
        }
      } catch (error) {
        console.error("Failed to edit service:", error);
      }
    }
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
                  onClick={(e) => handleEdit(e, srv)}
                >
                  ✎
                </button>
                <button 
                  className="srv-delete-btn" 
                  title="Delete"
                  onClick={(e) => handleDelete(e, srv)}
                >
                  ✕
                </button>
              </div>

            </div>

          ))}

          <div className="dropdown-item add-new" onClick={handleAddNew}>
            Add New Service...
          </div>

        </div>

      )}

    </div>

  );

}

export default CustomDropdown;
