export const ThrowError = (response, statusCode, message) => {
    return response.status(statusCode ?? 500).json({
        success: false,
        message: message ?? "Internal Server Error",
        result: null,
    });
};