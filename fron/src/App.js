import React, { useState, useEffect } from "react";
import Billing from "./components/Billing";
import Dashboard from "./components/Dashboard";
import InvoiceHistory from "./components/InvoiceHistory";
import Customers from "./components/Customers";
import Navbar from "./components/Navbar";
import Appointments from "./components/Appointments";
import Services from "./components/Services";
import LoginModal from "./components/LoginModal";
import { apiRequest } from "./utils/api";

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isAuth = sessionStorage.getItem("isAuth") === "true";
    const token = sessionStorage.getItem("token");
    if (isAuth && !token) {
        sessionStorage.clear();
        return false;
    }
    return isAuth;
  });

  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "theme-gold";
  });

  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem("invoices");
    return saved ? JSON.parse(saved) : [];
  });

  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem("customers");
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem("appointments");
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch Services from Backend
  useEffect(() => {
    if (isAuthenticated) {
      const loadServices = async () => {
        try {
          const res = await apiRequest("/getAllServices");
          if (res.success) {
            setServices(res.result);
          }
        } catch (error) {
          console.error("Failed to load services:", error);
        }
      };
      loadServices();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem("invoices", JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem("customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.body.className = theme;
  }, [theme]);

  // Initial load
  useEffect(() => {
    document.body.className = theme;
  }, []);

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("currentUserName") || "Administrator";
  });

  const handleLogin = (name) => {
    setIsAuthenticated(true);
    setUserName(name || "Administrator");
    sessionStorage.setItem("isAuth", "true");
    localStorage.setItem("currentUserName", name || "Administrator");
  };

  if (!isAuthenticated) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (

    <div className={`app ${theme}`}>

      <Navbar 
        setPage={setPage} 
        page={page} 
        theme={theme} 
        setTheme={setTheme} 
        setIsAuthenticated={setIsAuthenticated} 
        userName={userName}
      />

      <div className="main">

        {page === "dashboard" && (
          <Dashboard invoices={invoices} customers={customers} />
        )}

        {page === "billing" && (
          <Billing
            setInvoices={setInvoices}
            setCustomers={setCustomers}
            services={services}
            setServices={setServices}
          />
        )}

        {page === "appointments" && (
          <Appointments
            appointments={appointments}
            setAppointments={setAppointments}
            setInvoices={setInvoices}
            setCustomers={setCustomers}
            services={services}
            setServices={setServices}
          />
        )}

        {page === "services" && (
          <Services
            services={services}
            setServices={setServices}
          />
        )}

        {page === "history" && (
          <InvoiceHistory
            invoices={invoices}
            setInvoices={setInvoices}
          />
        )}

        {page === "customers" && (
          <Customers invoices={invoices} />
        )}

      </div>

    </div>

  );

}

export default App;