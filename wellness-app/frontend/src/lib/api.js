const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const request = async (path, options = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.detail?.[0]?.msg ||
      data?.detail ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
};

export const signup = (data) =>
  request("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const login = (data) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMe = (token) =>
  request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const getLogs = (token) =>
  request("/logs", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const saveLog = (token, date, data) =>
  request(`/logs/${date}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const deleteLog = (token, date) =>
  request(`/logs/${date}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
export const getPeriods = (token) =>
  request("/periods", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const addPeriodApi = (token, period) =>
  request("/periods", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(period),
  });

export const updatePeriodApi = (token, id, patch) =>
  request(`/periods/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

export const deletePeriodApi = (token, id) =>
  request(`/periods/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const getSymptomsApi = (token) =>
  request("/symptoms", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const saveSymptomsApi = (token, date, symptoms) =>
  request(`/symptoms/${encodeURIComponent(date)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ symptoms }),
  });
export const getMealsApi = (token) =>
  request("/meals", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const saveMealsApi = (token, date, meals) =>
  request(`/meals/${encodeURIComponent(date)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(meals),
  });