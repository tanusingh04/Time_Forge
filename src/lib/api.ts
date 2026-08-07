class ApiClient {
  private formatUrl(url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/api")) return url;
    return url.startsWith("/") ? `/api${url}` : `/api/${url}`;
  }

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async get<T = any>(url: string): Promise<T> {
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

  async post<T = any>(url: string, body?: any): Promise<T> {
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

  async put<T = any>(url: string, body?: any): Promise<T> {
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

  async delete<T = any>(url: string): Promise<T> {
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

  async upload<T = any>(url: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {};
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
