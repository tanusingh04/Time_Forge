class ApiClient {
    formatUrl(url) {
        if (url.startsWith("http://") || url.startsWith("https://"))
            return url;
        if (url.startsWith("/api"))
            return url;
        return url.startsWith("/") ? `/api${url}` : `/api/${url}`;
    }
    getHeaders() {
        const token = localStorage.getItem("token");
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }
    async get(url) {
        const response = await fetch(this.formatUrl(url), {
            method: "GET",
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        return res.data;
    }
    async post(url, body) {
        const response = await fetch(this.formatUrl(url), {
            method: "POST",
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        return res.data;
    }
    async put(url, body) {
        const response = await fetch(this.formatUrl(url), {
            method: "PUT",
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        return res.data;
    }
    async delete(url) {
        const response = await fetch(this.formatUrl(url), {
            method: "DELETE",
            headers: this.getHeaders(),
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        return res.data;
    }
    async upload(url, formData) {
        const token = localStorage.getItem("token");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        const response = await fetch(this.formatUrl(url), {
            method: "POST",
            headers,
            body: formData,
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const res = await response.json();
        return res.data;
    }
}
export const api = new ApiClient();
