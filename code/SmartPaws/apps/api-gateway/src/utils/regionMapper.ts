// Simple Austin region mapper using ZIP codes and neighborhood keywords
// Note: This is a heuristic mapper that avoids external geocoding

export function regionFromAddress(addressRaw?: string): string | undefined {
  if (!addressRaw) return undefined;
  const address = String(addressRaw).toLowerCase();

  // Neighborhood keyword checks (highest priority)
  if (address.includes('barton hills')) return 'Barton Hills';
  if (address.includes('zilker')) return 'Zilker';
  if (address.includes('mueller')) return 'Mueller';
  if (address.includes('downtown')) return 'Downtown Austin';

  // Try to extract a 5-digit ZIP (Austin zips are 787xx)
  const zipMatch = address.match(/\b(787\d{2})\b/);
  const zip = zipMatch ? zipMatch[1] : undefined;

  if (zip) {
    const z = Number(zip);
    // Buckets roughly matching Austin areas
    const eastZips = new Set([78702, 78721, 78722, 78723, 78724, 78725, 78741, 78744, 78752]);
    const westZips = new Set([78703, 78731, 78746, 78733, 78735, 78730]);
    const northZips = new Set([78727, 78728, 78729, 78753, 78757, 78758, 78759]);
    const southZips = new Set([78704, 78745, 78747, 78748, 78749]);

    if (eastZips.has(z)) return 'East Austin';
    if (westZips.has(z)) return 'West Austin';
    if (northZips.has(z)) return 'North Austin';
    if (southZips.has(z)) return 'South Austin';

    // Specific ZIPs to neighborhoods
    if (z === 78704 && address.includes('barton')) return 'Barton Hills';
    if (z === 78704 && address.includes('zilker')) return 'Zilker';
    if (z === 78723 && address.includes('mueller')) return 'Mueller';
    if (z === 78701) return 'Downtown Austin';
  }

  // Secondary keyword inference if no ZIP
  if (address.includes('east')) return 'East Austin';
  if (address.includes('west')) return 'West Austin';
  if (address.includes('north')) return 'North Austin';
  if (address.includes('south')) return 'South Austin';

  // Could not determine
  return undefined;
}
