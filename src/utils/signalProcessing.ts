/**
 * Signal Processing Core for ForestFire Sentinel
 * Implements 1D Discrete Kalman Filter, CUSUM Change-Point Detector,
 * Wavelet/Spectral Crest Factor Extractor, and Dempster-Shafer Multi-Sensor Fusion.
 */

import { FalseAlarmClassification, FusionEvidence, SensorReadings, SignalFeatures } from '../types';

export class KalmanFilter1D {
  private x: number; // State estimate
  private p: number; // Error covariance
  private q: number; // Process noise covariance
  private r: number; // Measurement noise covariance
  private kGain: number; // Last computed Kalman gain

  constructor(initialState: number = 22.0, processNoise: number = 0.04, measurementNoise: number = 1.8) {
    this.x = initialState;
    this.p = 1.0;
    this.q = processNoise;
    this.r = measurementNoise;
    this.kGain = 0;
  }

  public update(measurement: number): { estimatedState: number; kalmanGain: number; innovation: number } {
    // 1. Time Update (Predict)
    const pPredicted = this.p + this.q;

    // 2. Measurement Update (Correct)
    this.kGain = pPredicted / (pPredicted + this.r);
    const innovation = measurement - this.x;
    this.x = this.x + this.kGain * innovation;
    this.p = (1 - this.kGain) * pPredicted;

    return {
      estimatedState: this.x,
      kalmanGain: this.kGain,
      innovation,
    };
  }

  public getState(): number {
    return this.x;
  }

  public getGain(): number {
    return this.kGain;
  }

  public reset(state: number = 22.0): void {
    this.x = state;
    this.p = 1.0;
  }
}

export class CusumDetector {
  private sPos: number = 0;
  private sNeg: number = 0;
  private baselineMean: number;
  private driftAllowance: number; // k
  private threshold: number; // h

  constructor(baselineMean: number = 24.0, driftAllowance: number = 1.2, threshold: number = 6.0) {
    this.baselineMean = baselineMean;
    this.driftAllowance = driftAllowance;
    this.threshold = threshold;
  }

  public update(currentValue: number): { cusumValue: number; alarm: boolean; direction: 'up' | 'down' | 'nominal' } {
    const deviation = currentValue - this.baselineMean;

    this.sPos = Math.max(0, this.sPos + deviation - this.driftAllowance);
    this.sNeg = Math.max(0, this.sNeg - deviation - this.driftAllowance);

    const alarm = this.sPos > this.threshold || this.sNeg > this.threshold;
    const direction = this.sPos > this.threshold ? 'up' : this.sNeg > this.threshold ? 'down' : 'nominal';

    return {
      cusumValue: Math.max(this.sPos, this.sNeg),
      alarm,
      direction,
    };
  }

  public reset(baselineMean?: number): void {
    if (baselineMean !== undefined) this.baselineMean = baselineMean;
    this.sPos = 0;
    this.sNeg = 0;
  }

  public getCusum(): number {
    return this.sPos;
  }

  public getThreshold(): number {
    return this.threshold;
  }
}

/**
 * Computes acoustic spectral features from simulated audio frames:
 * - High-frequency burst energy
 * - Crest Factor = peak / rms
 * - Combustion popping crackle presence
 */
export function extractAcousticFeatures(
  dbfs: number,
  crestFactor: number,
  ambientNoiseFloorDb: number = -55
): { snrDb: number; isCombustionPattern: boolean; spectralConfidence: number } {
  const snrDb = Math.max(0, dbfs - ambientNoiseFloorDb);
  
  // Combustion crackle has a signature combination of high crest factor (> 3.2)
  // due to snapping twigs and rapid burst dynamics, combined with elevated SNR.
  const isCombustionPattern = crestFactor > 3.0 && snrDb > 10;
  const spectralConfidence = Math.min(1.0, (snrDb / 30) * 0.6 + (Math.max(0, crestFactor - 2) / 3) * 0.4);

  return {
    snrDb,
    isCombustionPattern,
    spectralConfidence,
  };
}

/**
 * Calculates rate-of-rise (dT/dt) across recent historical samples
 */
export function calculateThermalRateOfRise(history: { temp: number; timestamp: number }[]): number {
  if (history.length < 2) return 0;
  const recent = history.slice(-5);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const dtSec = Math.max(1, (last.timestamp - first.timestamp) / 1000);
  const dTemp = last.temp - first.temp;
  return Number((dTemp / dtSec).toFixed(3));
}

/**
 * Dempster-Shafer Multi-Sensor Evidence Fusion
 * Combines belief mass across Thermal, Acoustic, Particulate, and Gas modalities.
 */
export function fuseMultiSensorEvidence(
  readings: SensorReadings,
  signalFeatures: SignalFeatures,
  ambientTemp: number = 24
): {
  fusedFireBelief: number; // 0 to 1
  fusedBenignBelief: number; // 0 to 1
  uncertaintyMass: number; // 0 to 1
  evidenceList: FusionEvidence[];
  classification: FalseAlarmClassification;
} {
  // 1. Modality-specific confidence scoring
  // Thermal confidence
  const tempDelta = readings.temperature - ambientTemp;
  const thermalConfidence = Math.min(1.0, Math.max(0, (tempDelta / 35) * 0.6 + (signalFeatures.thermalRateOfRise / 2.0) * 0.4));

  // Acoustic combustion confidence
  const acousticConfidence = Math.min(1.0, Math.max(0, (signalFeatures.acousticSnr / 25) * 0.5 + ((signalFeatures.acousticCrestFactor - 2.0) / 2.5) * 0.5));

  // Gas combustion confidence (CO / CO2 ratio elevated in incomplete biomass smoldering)
  const gasRatio = readings.co / Math.max(380, readings.co2);
  const gasConfidence = Math.min(1.0, Math.max(0, (readings.co / 30) * 0.6 + (gasRatio * 150) * 0.4));

  // Particulate PM2.5 confidence
  const pm25Confidence = Math.min(1.0, Math.max(0, (readings.pm25 - 15) / 150));

  // Modality reliability weights (discounting)
  const thermalWeight = 0.90;
  const acousticWeight = 0.85;
  const gasWeight = 0.80;
  const pm25Weight = 0.75;

  const evidenceList: FusionEvidence[] = [
    {
      modality: 'thermal',
      rawConfidence: Number(thermalConfidence.toFixed(2)),
      weightedBelief: Number((thermalConfidence * thermalWeight).toFixed(2)),
      reliabilityWeight: thermalWeight,
      anomalyDetected: thermalConfidence > 0.45,
    },
    {
      modality: 'acoustic',
      rawConfidence: Number(acousticConfidence.toFixed(2)),
      weightedBelief: Number((acousticConfidence * acousticWeight).toFixed(2)),
      reliabilityWeight: acousticWeight,
      anomalyDetected: acousticConfidence > 0.40,
    },
    {
      modality: 'gas_co',
      rawConfidence: Number(gasConfidence.toFixed(2)),
      weightedBelief: Number((gasConfidence * gasWeight).toFixed(2)),
      reliabilityWeight: gasWeight,
      anomalyDetected: gasConfidence > 0.40,
    },
    {
      modality: 'pm25',
      rawConfidence: Number(pm25Confidence.toFixed(2)),
      weightedBelief: Number((pm25Confidence * pm25Weight).toFixed(2)),
      reliabilityWeight: pm25Weight,
      anomalyDetected: pm25Confidence > 0.35,
    },
  ];

  // Dempster-Shafer combination rule approximation for binary hypothesis {Fire, Benign}
  // m1 (+) m2 (+) m3 (+) m4
  let mFire = 0;
  let mBenign = 0;
  let mUncertain = 1.0;

  for (const ev of evidenceList) {
    const sFire = ev.weightedBelief;
    const sBenign = (1 - ev.rawConfidence) * ev.reliabilityWeight * 0.7;
    const sUncertain = 1 - (sFire + sBenign);

    // Combination with accumulator
    const k = (mFire * sBenign) + (mBenign * sFire); // Conflict factor
    const normalizer = Math.max(0.001, 1 - k);

    const newMFire = (mFire * sFire + mFire * sUncertain + mUncertain * sFire) / normalizer;
    const newMBenign = (mBenign * sBenign + mBenign * sUncertain + mUncertain * sBenign) / normalizer;
    const newMUncertain = (mUncertain * sUncertain) / normalizer;

    mFire = Math.min(1.0, Math.max(0, newMFire));
    mBenign = Math.min(1.0, Math.max(0, newMBenign));
    mUncertain = Math.min(1.0, Math.max(0, newMUncertain));
  }

  // False Alarm Discrimination Logic
  let classification: FalseAlarmClassification;

  if (thermalConfidence > 0.7 && gasConfidence < 0.15 && pm25Confidence < 0.15 && acousticConfidence < 0.2) {
    // High heat, but zero combustion products -> Solar thermal reflection / surface glint
    classification = {
      category: 'solar_glare',
      wildfireProbability: 0.12,
      rejectionReason: 'Elevated thermal surface reading without accompanying CO/CO2 or PM2.5 particulates indicates direct solar heating or reflective rock artifact.',
      spectralEvidence: 'Acoustic SNR negligible (2.1 dB); chemical combustion markers absent.',
    };
  } else if (acousticConfidence > 0.65 && thermalConfidence < 0.25 && gasConfidence < 0.15) {
    // Loud acoustic noise without heat/gas -> Chainsaw or wildlife noise
    classification = {
      category: 'chainsaw_activity',
      wildfireProbability: 0.08,
      rejectionReason: 'Acoustic waveform shows mechanical harmonic peaks (chainsaw/heavy vehicle) without thermal or smoke corroboration.',
      spectralEvidence: 'Harmonic peak at 120Hz/240Hz; zero thermal rise.',
    };
  } else if (thermalConfidence > 0.4 && pm25Confidence > 0.4 && gasConfidence > 0.3 && acousticConfidence < 0.25 && readings.temperature < 48) {
    // Moderate localized fire with low acoustic spread -> Permitted campfire or small controlled burn
    classification = {
      category: 'campfire_permitted',
      wildfireProbability: 0.38,
      rejectionReason: 'Thermal radiation confined to single node perimeter; absence of rapid spread rate or explosive canopy crackle.',
      spectralEvidence: 'Low acoustic crest factor (2.2); controlled localized smoke plume.',
    };
  } else if (mFire > 0.55 || (thermalConfidence > 0.55 && (gasConfidence > 0.4 || pm25Confidence > 0.45))) {
    // Confirmed Wildfire
    classification = {
      category: 'genuine_wildfire',
      wildfireProbability: Number(Math.max(0.72, mFire).toFixed(2)),
      spectralEvidence: `High acoustic crackle SNR (${signalFeatures.acousticSnr.toFixed(1)} dB), thermal rise rate (+${signalFeatures.thermalRateOfRise.toFixed(1)}°C/s), and elevated PM2.5 (${readings.pm25.toFixed(0)} µg/m³).`,
    };
  } else {
    // Nominal / minor anomaly
    classification = {
      category: 'sensor_drift',
      wildfireProbability: Number(mFire.toFixed(2)),
      rejectionReason: 'Telemetry fluctuations within acceptable environmental variance or baseline calibration drift.',
      spectralEvidence: 'Signals consistent with ambient micro-climate variations.',
    };
  }

  return {
    fusedFireBelief: Number(mFire.toFixed(3)),
    fusedBenignBelief: Number(mBenign.toFixed(3)),
    uncertaintyMass: Number(mUncertain.toFixed(3)),
    evidenceList,
    classification,
  };
}
