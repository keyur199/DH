const API_BASE = "http://localhost:8000/api";

const getHeaders = () => {
    const token = sessionStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json"
    };
    if (token && token !== "null") {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

export const apiRequest = async (endpoint, method = "GET", body = null) => {
    try {
        const options = {
            method,
            headers: getHeaders(),
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.message || data.msg || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
};
