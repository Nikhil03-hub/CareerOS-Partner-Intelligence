export const formatINR = (lpa) => {
  if (lpa == null) return "—";
  if (lpa >= 100) return `₹${(lpa / 100).toFixed(2)} Cr`;
  return `₹${lpa.toFixed(1)} L`;
};

export const cls = (...args) => args.filter(Boolean).join(" ");
