async function request(url, options = {}) {
    const response = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message), { errors: data.errors, status: response.status });
    return data;
}

export async function getCurrentUser() {
    try {
        return (await request("/api/auth/me")).user;
    } catch (error) {
        if (error.status === 401) return null;
        throw error;
    }
}

export async function register(fields) {
    return (await request("/api/auth/register", { method: "POST", body: JSON.stringify(fields) })).user;
}

export async function sendEmailVerification(email) {
    return request("/api/auth/send-verification", { method: "POST", body: JSON.stringify({ email }) });
}

export async function verifyEmail(email, code) {
    return request("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
}

export async function login(fields) {
    return (await request("/api/auth/login", { method: "POST", body: JSON.stringify(fields) })).user;
}

export async function logout() {
    await request("/api/auth/logout", { method: "POST" });
}
