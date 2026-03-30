import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

function Dashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allInvoices, setAllInvoices] = useState([]);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvoices: 0,
    totalCustomers: 0
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState(new Array(12).fill(0));
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const invRes = await apiRequest("/getAllInvoices");
      if (invRes.success) {
        setAllInvoices(invRes.result);
        applyFilters(invRes.result);
      }
    } catch (error) {
      console.error("Dashboard Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

    // NUMERIC DATE PARSER: Converts any date to YYYYMMDD integer for absolute comparison
    const getDateVal = (input) => {
      if (!input) return 0;
      let dStr = String(input).split("T")[0].replace(/\//g, "-").trim();
      const parts = dStr.split("-");
      let y, m, d;
      if (parts.length === 3) {
        if (parts[0].length === 4) { [y, m, d] = parts; } 
        else if (parts[2].length === 4) { [d, m, y] = parts; }
      }
      if (y && m && d) return parseInt(y) * 10000 + parseInt(m) * 100 + parseInt(d);
      const dd = new Date(input);
      if (isNaN(dd.getTime())) return 0;
      return dd.getFullYear() * 10000 + (dd.getMonth() + 1) * 100 + dd.getDate();
    };

    const applyFilters = (invoices) => {
      let filtered = [...invoices];
      const startVal = getDateVal(startDate);
      const endVal = getDateVal(endDate);

      filtered = filtered.filter(inv => {
        const invDateVal = getDateVal(inv.date) || getDateVal(inv.createdAt);
        if (invDateVal === 0) return true;
        if (startVal > 0 && invDateVal < startVal) return false;
        if (endVal > 0 && invDateVal > endVal) return false;
        return true;
      });

      // Stats
      const totalRev = filtered.reduce((acc, inv) => acc + Number(inv.totalAmount || inv.total || 0), 0);
      const uniqueCustomers = new Set(filtered.map(inv => inv.mobileNumber || inv.mobile)).size;
      setStats({
        totalRevenue: totalRev,
        totalInvoices: filtered.length,
        totalCustomers: uniqueCustomers
      });

      // Monthly
      const monthsData = new Array(12).fill(0);
      filtered.forEach(inv => {
          let y, m, d;
          let dStr = String(inv.date || inv.createdAt).split("T")[0].replace(/\//g, "-").trim();
          const parts = dStr.split("-");
          if (parts.length === 3) {
              if (parts[0].length === 4) { [y, m, d] = parts; } 
              else if (parts[2].length === 4) { [d, m, y] = parts; }
              if (y && m) monthsData[parseInt(m) - 1] += Number(inv.totalAmount || inv.total || 0);
          } else {
              const fallback = new Date(inv.date || inv.createdAt);
              if (!isNaN(fallback.getTime())) monthsData[fallback.getMonth()] += Number(inv.totalAmount || inv.total || 0);
          }
      });
      setMonthlyRevenue(monthsData);

      // 3. Service Performance
      const serviceCounts = {};
      let totalServiceCount = 0;
      filtered.forEach(inv => {
        const servicesToScan = inv.services || inv.items || [];
        if (Array.isArray(servicesToScan)) {
          servicesToScan.forEach(item => {
            const sName = item.name || item.serviceName || "Unknown";
            serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
            totalServiceCount++;
          });
        }
      });
      const sortedServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({
          name,
          val: totalServiceCount > 0 ? Math.round((count / totalServiceCount) * 100) : 0
        }))
        .sort((a, b) => b.val - a.val)
        .slice(0, 4);

      setTopServices(sortedServices.length > 0 ? sortedServices : [{ name: "No data in range", val: 0 }]);
    };

  // Re-run filter when dates change
  useEffect(() => {
    if (allInvoices.length > 0) {
      applyFilters(allInvoices);
    }
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

        <div className="dashboard-filters">
          <div className="filter-group">
            <label>FROM</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>TO</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          {(startDate || endDate) && (
            <button className="clear-filter-btn" onClick={() => { setStartDate(""); setEndDate(""); }}>✕ CLEAR</button>
          )}
        </div>
      </div>

      <div className="cards">
        <div className="card revenue shadow-gold">
          <div className="card-icon">₹</div>
          <h3>Revenue</h3>
          <p>₹ {stats.totalRevenue.toLocaleString()}</p>
          <span className="card-trend">{startDate || endDate ? "Filtered" : "All Time"} Income</span>
        </div>

        <div className="card invoices shadow-rose">
          <div className="card-icon">📄</div>
          <h3>Invoices</h3>
          <p>{String(stats.totalInvoices).padStart(2, "0")}</p>
          <span className="card-trend">{stats.totalInvoices} Orders</span>
        </div>

        <div className="card customers shadow-blue">
          <div className="card-icon">👥</div>
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