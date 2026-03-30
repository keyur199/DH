import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

import { IconTrendingUp, IconFileText, IconUsers } from "./Icons";

function Dashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState(new Array(12).fill(0));
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const setQuickFilter = (type) => {
    setActiveFilter(type);
    const today = new Date();
    const formatDate = (date) => {
      const offset = date.getTimezoneOffset() * 60000;
      return new Date(date.getTime() - offset).toISOString().split('T')[0];
    };

    if (type === 'today') {
      const t = formatDate(today);
      setStartDate(t);
      setEndDate(t);
    } else if (type === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const yStr = formatDate(yesterday);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (type === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 6);
      setStartDate(formatDate(lastWeek));
      setEndDate(formatDate(today));
    } else if (type === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(today));
    } else if (type === 'all') {
      setStartDate("");
      setEndDate("");
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch static growth chart once
      const growthRes = await apiRequest("/getRevenueGrowth");
      if (growthRes.success) setMonthlyRevenue(growthRes.result);
      
      // Fetch initial stats
      await fetchDynamicStats();
    } catch (err) {
      console.error("Initial load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDynamicStats = async () => {
    try {
      const query = `?startDate=${startDate || ""}&endDate=${endDate || ""}`;
      
      const [statsRes, topRes] = await Promise.all([
        apiRequest(`/getDashboardStats${query}`),
        apiRequest(`/getTopServices${query}`)
      ]);

      if (statsRes.success) setStats(statsRes.result);
      if (topRes.success) {
        setTopServices(topRes.result.length > 0 ? topRes.result : [{ name: "No data in range", val: 0 }]);
      }
    } catch (err) {
      console.error("Filtering failed:", err);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    if (!loading) fetchDynamicStats();
  }, [startDate, endDate]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const maxMonthly = Math.max(...monthlyRevenue, 1);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Refreshing Dashboard...</div>;
  }

  return (
    <div className="dashboard-page animate-in">
      <div className="dashboard-header-redux">
        <h1 className="page-title">Dashboard Overview</h1>

        <div className="dashboard-filters-wrapper">
          <div className="dashboard-filters">
            <div className="filter-group">
              <label>FROM</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>TO</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="quick-filters">
            <button className={`q-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setQuickFilter('all')}>ALL TIME</button>
            <button className={`q-btn ${activeFilter === 'today' ? 'active' : ''}`} onClick={() => setQuickFilter('today')}>TODAY</button>
            <button className={`q-btn ${activeFilter === 'yesterday' ? 'active' : ''}`} onClick={() => setQuickFilter('yesterday')}>YESTERDAY</button>
            <button className={`q-btn ${activeFilter === 'week' ? 'active' : ''}`} onClick={() => setQuickFilter('week')}>7 DAYS</button>
            <button className={`q-btn ${activeFilter === 'month' ? 'active' : ''}`} onClick={() => setQuickFilter('month')}>THIS MONTH</button>
          </div>
        </div>
      </div>

      <div className="cards">
        <div className="card revenue shadow-gold">
          <div className="card-icon"><IconTrendingUp size={32} color="#d4af37" /></div>
          <h3>Revenue</h3>
          <p>₹ {stats.totalRevenue.toLocaleString()}</p>
          <span className="card-trend">{startDate || endDate ? "Filtered" : "All Time"} Income</span>
        </div>

        <div className="card invoices shadow-rose">
          <div className="card-icon"><IconFileText size={32} color="#d68b98" /></div>
          <h3>Invoices</h3>
          <p>{String(stats.totalInvoices).padStart(2, "0")}</p>
          <span className="card-trend">{stats.totalInvoices} Orders</span>
        </div>

        <div className="card customers shadow-blue">
          <div className="card-icon"><IconUsers size={32} color="#60a5fa" /></div>
          <h3>Customers</h3>
          <p>{String(stats.totalCustomers).padStart(2, "0")}</p>
          <span className="card-trend">Unique Clients</span>
        </div>
      </div>



      <div className="dashboard-charts">
        <div className="chart-card revenue-chart glass-effect">
          <div className="chart-header">
            <h3>Revenue Growth ({new Date().getFullYear()})</h3>
          </div>
          <div className="bar-container">
            {months.map((month, i) => {
              const h = (monthlyRevenue[i] / maxMonthly) * 85 + 5;
              return (
                <div key={i} className="bar-wrapper">
                  <div className="bar" style={{ height: `${h}%` }}>
                    <span className="bar-value">₹{monthlyRevenue[i]}</span>
                  </div>
                  <span className="bar-label">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-card services-performance glass-effect">
          <div className="chart-header">
            <h3>Service Performance</h3>
          </div>
          <div className="perf-list">
            {topServices.map((s, i) => (
              <div key={i} className="perf-item">
                <div className="perf-info">
                  <span>{s.name}</span>
                  <span>{s.val}%</span>
                </div>
                <div className="perf-track">
                  <div className="perf-bar" style={{ width: `${s.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;