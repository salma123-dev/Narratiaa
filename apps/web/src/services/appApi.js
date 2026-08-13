async function request(url, options = {}) {
    const response = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
}

export const api = {
    books: () => request("/api/books"),
    book: (id) => request(`/api/books/${id}`),
    createBook: (book) => request("/api/books", { method: "POST", body: JSON.stringify(book) }),
    updateBook: (id, book) => request(`/api/books/${id}`, { method: "PUT", body: JSON.stringify(book) }),
    deleteBook: (id) => request(`/api/books/${id}`, { method: "DELETE" }),
    addSession: (id, session) => request(`/api/books/${id}/sessions`, { method: "POST", body: JSON.stringify(session) }),
    session: (id) => request(`/api/reading-sessions/${id}`),
    updateSession: (id, session) => request(`/api/reading-sessions/${id}`, { method: "PUT", body: JSON.stringify(session) }),
    deleteSession: (id) => request(`/api/reading-sessions/${id}`, { method: "DELETE" }),
    journal: () => request("/api/journal"),
    journalEntry: (id) => request(`/api/journal/${id}`),
    createEntry: (entry) => request("/api/journal", { method: "POST", body: JSON.stringify(entry) }),
    updateEntry: (id, entry) => request(`/api/journal/${id}`, { method: "PUT", body: JSON.stringify(entry) }),
    deleteEntry: (id) => request(`/api/journal/${id}`, { method: "DELETE" }),
    stats: () => request("/api/stats"),
    goals: () => request("/api/goals"),
    updateGoals: (goal) => request("/api/goals", { method: "PUT", body: JSON.stringify(goal) }),
    onboarding: () => request("/api/onboarding"),
    completeOnboarding: (data) => request("/api/onboarding", { method: "PUT", body: JSON.stringify(data) }),
    searchCatalog: (query) => request(`/api/catalog/search?q=${encodeURIComponent(query)}`),
};
