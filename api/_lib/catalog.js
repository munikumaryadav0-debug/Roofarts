// Authoritative USD catalogue. Confirm these sample rates with RoofArts before launch.
export const CATALOG = Object.freeze({
  "roof-report": { name: "Roof Measurement Report", price: 49.00 },
  "siding-report": { name: "Wall & Siding Measurements", price: 39.00 },
  "gutter-report": { name: "Gutter Measurements", price: 29.00 },
  "exterior-report": { name: "Complete Exterior Report", price: 99.00 },
  "blueprint-takeoff": { name: "Blueprint Takeoff", price: 79.00 },
  "specialty-measurement": { name: "Specialty Measurements", price: 59.00 }
});

export function calculateOrder(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 6) {
    throw new Error("Choose at least one service.");
  }
  const seen = new Set();
  const lines = items.map(({ id, quantity }) => {
    const product = CATALOG[id];
    if (!product || seen.has(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Your cart contains an invalid service or quantity.");
    }
    seen.add(id);
    return { id, name: product.name, quantity, unit: product.price, line: product.price * quantity };
  });
  const total = Math.round(lines.reduce((sum, item) => sum + item.line, 0) * 100) / 100;
  return { lines, total };
}
