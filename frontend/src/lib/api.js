import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const apiUrl = (path) => `${BASE}/api${path}`;
