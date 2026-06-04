const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;

export function formatCnic(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function validateCnic(cnic) {
  return CNIC_REGEX.test(cnic);
}

export function normalizeCnic(cnic) {
  return cnic.replace(/\D/g, "");
}
