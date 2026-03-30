import React, { useState } from "react";
import { generateInvoice } from "../utils/generateInvoice";
import CustomDropdown from "./CustomDropdown";
import { apiRequest } from "../utils/api";

function Billing({ setInvoices, setCustomers, services, setServices }) {

  const [customer, setCustomer] = useState("");
  const [mobile, setMobile] = useState("");

  const [items, setItems] = useState([
    { name: "", qty: 1, price: 0 }
  ]);

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
      alert("Enter customer details");
      return;
    }

    const invoice = generateInvoice(customer, mobile, items);

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
        setItems([{ name: "", qty: 1, price: 0 }]);
      }
    } catch (error) {
      alert("Failed to save invoice: " + error.message);
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
        </div>

        <div className="services-box">
          <div className="service-header">
            <div>Service</div>
            <div>Qty</div>
            <div>Price</div>
            <div>Action</div>
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
                placeholder="Qty"
                value={item.qty === 0 ? "" : item.qty}
                onChange={(e) => updateItem(i, "qty", e.target.value === "" ? 0 : Number(e.target.value))}
              />

              <input
                type="number"
                placeholder="Price"
                value={item.price === 0 ? "" : item.price}
                onChange={(e) => updateItem(i, "price", e.target.value === "" ? 0 : Number(e.target.value))}
              />

              <button className="delete-btn" onClick={() => deleteItem(i)}>Delete</button>
            </div>
          ))}

          <button className="add-service-btn" onClick={addItem}>Add Service</button>
        </div>

        <div className="invoice-footer">
          <h3>Total ₹ {total}</h3>
          <button className="generate-btn" onClick={createInvoice}>Generate Invoice</button>
        </div>
      </div>
    </div>
  );
}

export default Billing;