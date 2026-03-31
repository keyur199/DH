import React, { useState } from "react";
import { generateInvoice } from "../utils/generateInvoice";
import CustomDropdown from "./CustomDropdown";
import { apiRequest } from "../utils/api";

function Billing({ setInvoices, setCustomers, services, setServices }) {

  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState([
    { name: "", qty: 1, price: 0 }
  ]);

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

  const addItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0 }]);
  };

  const deleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const updateItem = (i, key, value) => {
    const updated = [...items];
    updated[i][key] = value;
    setItems(updated);
  };

  const total = items.reduce((a, b) => a + b.qty * b.price, 0);

  const createInvoice = async () => {
    if (!customer || !mobile) {
      showAlert("Missing Details", "Please provide customer name and mobile number to generate invoice.");
      return;
    }

    const invoice = {
        customerName: customer,
        mobileNumber: mobile,
        services: items.map(i => ({ name: i.name, quantity: i.qty, price: i.price })),
        date: date
    };

    try {
      // Save Invoice to Backend
      const res = await apiRequest("/createInvoice", "POST", invoice);

      if (res.success) {
        setInvoices(prev => [res.result, ...prev]);

        // Save/Update Customer in UI (Backend usually handles this in dashboard stats, but we can update local state)
        setCustomers(prev => {
          const exists = prev.find(c => c.mobile === mobile);
          if (exists) return prev;
          return [...prev, { name: customer, mobile }];
        });

        // Reset form
        setCustomer("");
        setMobile("");
        setDate(new Date().toISOString().split('T')[0]);
        setItems([{ name: "", qty: 1, price: 0 }]);
      }
    } catch (error) {
      showAlert("Operation Failed", "Failed to save invoice: " + error.message);
    }
  };

  return (
    <div className="billing-container">
      <div className="billing-card">
        <h2>Create Invoice</h2>
        <div className="customer-grid">
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
            style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: 'white', 
              padding: '12px', 
              borderRadius: '10px' 
            }}
          />
        </div>

        <div className="services-box">
          <div className="service-header-row">
            <span className="col-srv">Service</span>
            <span className="col-qty">Qty</span>
            <span className="col-prc">Price</span>
            <span className="col-act">Action</span>
          </div>


          {items.map((item, i) => (
            <div key={i} className="service-row">
              <div className="input-group">
                <CustomDropdown
                  services={services}
                  setServices={setServices}
                  value={item.name}
                  onChange={(val) => {
                    const selected = services.find(s => s.name === val);
                    const updated = [...items];
                    updated[i].name = val;
                    if (selected) {
                      updated[i].price = selected.price;
                    }
                    setItems(updated);
                  }}
                />
              </div>

              <input
                type="number"
                className="qty-input"
                placeholder="Qty"
                value={item.qty === 0 ? "" : item.qty}
                onChange={(e) => updateItem(i, "qty", e.target.value === "" ? 0 : Number(e.target.value))}
              />

              <input
                type="number"
                className="price-input"
                placeholder="Price"
                value={item.price === 0 ? "" : item.price}
                onChange={(e) => updateItem(i, "price", e.target.value === "" ? 0 : Number(e.target.value))}
              />

              <button className="delete-btn-premium" onClick={() => deleteItem(i)} title="Remove Item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              </button>

            </div>

          ))}

          <button className="add-service-btn-premium" onClick={addItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Service
          </button>

        </div>

        <div className="invoice-footer">
          <h3>Total ₹ {total}</h3>
          <button className="generate-btn" onClick={createInvoice}>Generate Invoice</button>
        </div>
      </div>

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

export default Billing;