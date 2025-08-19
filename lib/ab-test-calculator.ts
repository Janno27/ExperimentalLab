export type ABTestParams = {
  audiencePerDay: number;   // Audience totale par jour
  conversionsPerDay: number; // Conversions par jour
  mde: number;              // Minimal Detectable Effect (en % relatif, ex: 0.05 = +5%)
  trafficExposed: number;   // Part du trafic envoyée au test (0-1)
  alpha?: number;           // Niveau de risque (défaut = 0.05 pour 95% confiance)
  power?: number;           // Puissance cible (défaut = 0.8 pour 80%)
};

export type ABTestResult = {
  baselineRate: number;     // p0
  delta: number;            // Différence absolue détectable
  samplePerGroup: number;   // n par groupe
  totalSample: number;      // n total (2 groupes)
  durationDays: number;     // Durée estimée en jours (avec min 7)
};

/**
 * Approximate inverse CDF (quantile) for standard normal
 * via Abramowitz-Stegun approximation
 */
function zQuantile(p: number): number {
  // Edge cases
  if (p <= 0 || p >= 1) throw new Error("p must be in (0,1)");

  const a1 = -39.6968302866538,
    a2 = 220.946098424521,
    a3 = -275.928510446969,
    a4 = 138.357751867269,
    a5 = -30.6647980661472,
    a6 = 2.50662827745924;

  const b1 = -54.4760987982241,
    b2 = 161.585836858041,
    b3 = -155.698979859887,
    b4 = 66.8013118877197,
    b5 = -13.2806815528857;

  const c1 = -0.00778489400243029,
    c2 = -0.322396458041136,
    c3 = -2.40075827716184,
    c4 = -2.54973253934373,
    c5 = 4.37466414146497,
    c6 = 2.93816398269878;

  const d1 = 0.00778469570904146,
    d2 = 0.32246712907004,
    d3 = 2.44513413714299,
    d4 = 3.75440866190742;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1)
    );
  }
}

export function estimateABTestDuration(params: ABTestParams): ABTestResult {
  const {
    audiencePerDay,
    conversionsPerDay,
    mde,
    trafficExposed,
    alpha = 0.05,
    power = 0.8,
  } = params;

  // Baseline conversion rate
  const p0 = conversionsPerDay / audiencePerDay;

  // MDE : relatif -> absolu
  const delta = p0 * mde;

  const p1 = p0;
  const p2 = p0 + delta;
  const pBar = (p1 + p2) / 2;

  // Z-scores
  const zAlpha = zQuantile(1 - alpha / 2);
  const zBeta = zQuantile(power);

  // Taille d'échantillon par groupe
  const numerator =
    zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
    zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  const nPerGroup = Math.ceil((numerator * numerator) / (delta * delta));

  // Nombre de visiteurs par jour par groupe
  const visitorsPerGroupPerDay = (audiencePerDay * trafficExposed) / 2;

  // Durée minimale en jours (au moins 7 pour un cycle complet)
  const durationDays = Math.max(
    7,
    Math.ceil(nPerGroup / visitorsPerGroupPerDay)
  );

  return {
    baselineRate: p0,
    delta,
    samplePerGroup: nPerGroup,
    totalSample: nPerGroup * 2,
    durationDays,
  };
} 