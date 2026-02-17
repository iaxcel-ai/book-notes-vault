const KEY = "vault:data";

export const loadBooks = () =>
JSON.parse(localStorage.getItem(KEY) || "[]");

export const saveBooks = (data) =>
localStorage.setItem(KEY, JSON.stringify(data));
