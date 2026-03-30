import { logoBase64 } from "../utils/logoData";

function Navbar({ setPage, page, theme, setTheme, setIsAuthenticated, userName }) {

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.removeItem("currentUserName");
        setIsAuthenticated(false);
    };

    return (

        <div className="sidebar">

            <div className="logo">
                <div className="nav-logo-container">
                    {logoBase64 ? (
                        <img src={logoBase64} alt="Salon Logo" className="navbar-logo" />
                    ) : (
                        <div className="logo-fallback">DH</div>
                    )}
                </div>
            </div>

            <div className="menu">

                <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Dashboard</button>

                <button className={page === "appointments" ? "active" : ""} onClick={() => setPage("appointments")}>Appointments</button>

                <button className={page === "billing" ? "active" : ""} onClick={() => setPage("billing")}>Create Invoice</button>

                <button className={page === "services" ? "active" : ""} onClick={() => setPage("services")}>Services</button>

                <button className={page === "history" ? "active" : ""} onClick={() => setPage("history")}>Invoices</button>

                <button className={page === "customers" ? "active" : ""} onClick={() => setPage("customers")}>Customers</button>
            </div>

            <div className="sidebar-footer">
                <div className="theme-picker">
                    <button 
                        className={`theme-btn t-gold ${theme === 'theme-gold' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-gold')}
                        title="Luxury Gold"
                    />
                    <button 
                        className={`theme-btn t-rose ${theme === 'theme-rose' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-rose')}
                        title="Rose Pink"
                    />
                    <button 
                        className={`theme-btn t-sapphire ${theme === 'theme-sapphire' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-sapphire')}
                        title="Sapphire Blue"
                    />
                    <button 
                        className={`theme-btn t-emerald ${theme === 'theme-emerald' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-emerald')}
                        title="Emerald Green"
                    />
                    <button 
                        className={`theme-btn t-amethyst ${theme === 'theme-amethyst' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-amethyst')}
                        title="Amethyst Purple"
                    />
                    <button 
                        className={`theme-btn t-black ${theme === 'theme-black' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-black')}
                        title="Elegant Black"
                    />
                    <button 
                        className={`theme-btn t-white ${theme === 'theme-white' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-white')}
                        title="Clean White"
                    />
                    <button 
                        className={`theme-btn t-grey ${theme === 'theme-grey' ? 'active-theme' : ''}`} 
                        onClick={() => setTheme('theme-grey')}
                        title="Neutral Grey"
                    />
                </div>
                <button className="nav-logout-btn" onClick={handleLogout}>Lock System</button>
            </div>

        </div>

    )

}

export default Navbar;