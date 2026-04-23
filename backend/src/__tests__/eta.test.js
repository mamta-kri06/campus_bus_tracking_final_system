const { estimateEtaMinutes } = require("../utils/eta");

describe("ETA Utility Algorithm", () => {
  const campusGate = { latitude: 28.545, longitude: 77.1926 };
  const hostel = { latitude: 28.5475, longitude: 77.1895 }; // ~400m away

  describe("Validation & Guard Clauses", () => {
    test("should return null if 'from' or 'to' is missing", () => {
      expect(estimateEtaMinutes(null, hostel)).toBeNull();
      expect(estimateEtaMinutes(campusGate, null)).toBeNull();
    });

    test("should return null for invalid coordinates", () => {
      expect(estimateEtaMinutes({ latitude: 100, longitude: 77 }, hostel)).toBeNull();
      expect(estimateEtaMinutes(campusGate, { latitude: 28, longitude: "invalid" })).toBeNull();
    });

    test("should return null for invalid speeds", () => {
      expect(estimateEtaMinutes(campusGate, hostel, 0)).toBeNull();
      expect(estimateEtaMinutes(campusGate, hostel, -10)).toBeNull();
      expect(estimateEtaMinutes(campusGate, hostel, "fast")).toBeNull();
    });
  });

  describe("Predictive Accuracy & Logic", () => {
    test("should calculate correct ETA for known distance", () => {
      // 12km at 24km/h should be exactly 30 minutes
      // We'll mock the distance or use specific coords if we knew them, 
      // but let's use the actual haversine results.
      const from = { latitude: 28.0, longitude: 77.0 };
      const to = { latitude: 28.1079, longitude: 77.0 }; // ~12km north
      
      const eta = estimateEtaMinutes(from, to, 24);
      expect(eta).toBeGreaterThanOrEqual(25);
      expect(eta).toBeLessThanOrEqual(35);
    });

    test("should use default speed of 24km/h if not provided", () => {
      const from = { latitude: 28.0, longitude: 77.0 };
      const to = { latitude: 28.1079, longitude: 77.0 };
      
      const etaWithDefault = estimateEtaMinutes(from, to);
      const etaWithExplicit = estimateEtaMinutes(from, to, 24);
      expect(etaWithDefault).toBe(etaWithExplicit);
    });
  });

  describe("Boundary Clamping (The '10' Complexity Nodes)", () => {
    test("should clamp minimum ETA to 1 minute for very short distances", () => {
      // Distance of 1 meter
      const veryClose = { latitude: 28.5450001, longitude: 77.1926001 };
      const eta = estimateEtaMinutes(campusGate, veryClose, 60);
      expect(eta).toBe(1);
    });

    test("should clamp maximum ETA to 180 minutes for extreme distances", () => {
      // Distance across the globe (India to USA)
      const usa = { latitude: 37.0902, longitude: -95.7129 };
      const eta = estimateEtaMinutes(campusGate, usa, 24);
      expect(eta).toBe(180);
    });
  });
});
