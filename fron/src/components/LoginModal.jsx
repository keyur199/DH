import React, { useState } from "react";
import { logoBase64 } from "../utils/logoData";

const API_BASE = process.env.API_BASE || "http://localhost:8000/api";

function LoginModal({ onLogin }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgot, setIsForgot] = useState(false);
    
    // Recovery states
    const [recoveryStep, setRecoveryStep] = useState(1);
    const [securityAnswer, setSecurityAnswer] = useState("");

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [mobile, setMobile] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        const cleanInput = email.trim().toLowerCase(); 
        const cleanPassword = password.trim();

        if (isForgot) {
            handleRecovery(cleanInput);
            return;
        }

        // MASTER ADMIN OVERRIDE
        let finalInput = cleanInput;
        if (cleanInput === "admin" && cleanPassword === "admin@123") {
            finalInput = "admin@gmail.com";
        }

        try {
            setLoading(true);
            if (isSignUp) {
                if (!fullName.trim() || !mobile.trim() || !email.trim() || !cleanPassword) {
                    setError("All fields are required.");
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${API_BASE}/createRegister`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: fullName.trim(),
                        phone: mobile.trim(),
                        email: email.trim().toLowerCase(),
                        password: cleanPassword,
                        role: "admin"
                    })
                });
                const data = await res.json();
                if (data.success) {
                    sessionStorage.setItem("token", data.result.token);
                    onLogin(fullName.trim());
                } else {
                    setError(data.message || "Registration failed.");
                }
            } else {
                const res = await fetch(`${API_BASE}/loginUser`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: finalInput, password: cleanPassword })
                });
                const data = await res.json();
                if (data.success) {
                    sessionStorage.setItem("token", data.result.token);
                    onLogin(data.result.name);
                } else {
                    setError(data.message || "Invalid Gmail/Mobile or Password.");
                }
            }
        } catch (err) {
            console.error("Connection Error:", err);
            setError("Server connection failed. Run 'back' server.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecovery = async (cleanInput) => {
        try {
            setError("");
            setLoading(true);
            if (recoveryStep === 1) {
                const res = await fetch(`${API_BASE}/forgotPassword`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: cleanInput })
                });
                const data = await res.json();
                if (data.success) {
                    setRecoveryStep(2);
                } else {
                    setError(data.message);
                }
            } else {
                const res = await fetch(`${API_BASE}/VerifyEmail`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: cleanInput, otp: securityAnswer })
                });
                const data = await res.json();
                if (data.success) {
                    // In a real app, you'd show a reset password field here.
                    // For now, redirect to login.
                    setIsForgot(false);
                    setRecoveryStep(1);
                    setSecurityAnswer("");
                } else {
                    setError(data.message);
                }
            }
        } catch (err) {
            setError("Recovery service unreachable.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="v6-master-redux">
            {/* Left Brand Panel */}
            <div className="v6-brand-panel">
                <div className="v6-panel-content">
                    <div className="v6-panel-logo">
                        <img src={logoBase64} alt="Studio Logo" />
                    </div>
                    <h2>Makeup Studio & Academy</h2>
                    <p>Administrative Division</p>
                </div>
            </div>

            {/* Right Gateway Panel */}
            <div className="v6-gate-panel">
                {/* Flowing Watermark Background */}
                <div 
                    className="v6-gate-watermark" 
                    style={{ backgroundImage: `url(${logoBase64})` }}
                ></div>

                <div className="v6-redux-form">
                    <div className="v6-redux-header">
                        <h1 style={{ fontSize: '1.8rem' }}>{isForgot ? "RECOVERY" : "Makeup Studio & Academy"}</h1>
                        <p>{isForgot ? "OTP VERIFICATION" : "STUDIO GATEWAY"}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="v6-redux-body">
                        {isForgot ? (
                            <div className="v6-redux-input-set">
                                <label>{recoveryStep === 1 ? "Credential Identity" : "Verification Code"}</label>
                                <input
                                    className="v6-redux-field"
                                    type="text"
                                    placeholder={recoveryStep === 1 ? "Gmail or Mobile" : "Enter 4-Digit OTP"}
                                    value={recoveryStep === 1 ? email : securityAnswer}
                                    onChange={(e) => recoveryStep === 1 ? setEmail(e.target.value) : setSecurityAnswer(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <>
                                <div className="v6-redux-input-set">
                                    <label>Access Identifier</label>
                                    <input
                                        className="v6-redux-field"
                                        type="text"
                                        placeholder="Gmail or Mobile"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="v6-redux-input-set">
                                    <label>Secret Password</label>
                                    <div className="v6-redux-pass-wrap">
                                        <input
                                            className="v6-redux-field"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button 
                                            type="button" 
                                            className="v6-redux-eye"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>

                                <span className="v6-redux-forgot" onClick={() => setIsForgot(true)}>
                                    Forgotten Credentials?
                                </span>
                            </>
                        )}

                        {error && <div className="v6-redux-error">{error}</div>}

                        <button type="submit" className="v6-redux-btn" disabled={loading}>
                            {loading ? "AUTHORIZING..." : (isForgot ? (recoveryStep === 1 ? "VERIFY" : "RESTORE") : "ACCESS STUDIO")}
                        </button>
                    </form>

                    <footer className="v6-redux-footer">
                        {isForgot ? (
                            <p onClick={() => { setIsForgot(false); setRecoveryStep(1); setError(""); }}>
                                Return to <span>Administrator Entry</span>
                            </p>
                        ) : (
                            <p>Proprietary Studio Management System</p>
                        )}
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;
