export const getAdminHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const formatAdminDate = (date: string | number) => {
  if (!date) return "-";
  try {
    const d = typeof date === "number" ? new Date(date) : new Date(date);
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(date);
  }
};