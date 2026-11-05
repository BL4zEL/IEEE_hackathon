export type SensorModality =
  | 'thermal'
  | 'acoustic'
  | 'gas_co'
  | 'gas_co2'
  | 'pm25'
  | 'humidity'
  | 'ambient_temp';

export type SensorStatus = 'nominal' | 'anomaly' | 'alarm' | 'offline' | 'uncalibrated';

export interface SensorReadings {
  temperature: number; // °C
  humidity: number; // %
  pm25: number; // µg/m³
  co: number; // ppm
  co2: number; // ppm
  acousticDbfs: number; // dBFS
  acousticCrestFactor: number; // ratio (peak/rms)
  batteryLevel: number; // %
  timestamp: number; // ms
}

export interface SensorNode {
  id: string;
  name: string;
  x: number; // 0 to 1000 meters coordinate in forest
  y: number; // 0 to 1000 meters
  elevation: number; // meters
  zone: string;
  sensingRadius: number; // meters (e.g. 120m for thermal/smoke)
  communicationRadius: number; // meters (e.g. 280m for LoRaWAN mesh)
  status: SensorStatus;
  samplingIntervalSec: number; // adaptive (e.g. 60s nominal, 2s under alarm)
  powerState: 'sleep' | 'active' | 'burst_tx';
  hardwareCostUsd: number;
  batteryMah: number;
  readings: SensorReadings;
  rawHistory: { timestamp: number; temp: number; acoustic: number; gas: number; pm25: number }[];
  filteredHistory: { timestamp: number; temp: number; acoustic: number; gas: number; pm25: number }[];
  cusumValue: number;
  snrDb: number;
}

export interface WeatherCondition {
  ambientTemp: number; // °C
  relativeHumidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees (0 = North, 90 = East, 180 = South, 270 = West)
  droughtCode: number; // 0 - 800 (Canadian FWI sub-index)
  fwi: number; // 0 - 60+ (Fire Weather Index)
  solarIrradiance: number; // W/m²
  atmosphericPressure: number; // hPa
}

export interface FireSpot {
  id: string;
  x: number;
  y: number;
  radius: number; // meters
  intensityMw: number; // Megawatts radiative power
  type: 'wildfire_crown' | 'wildfire_surface' | 'campfire_safe' | 'solar_thermal_artifact' | 'agricultural_burn';
  ignitionTime: number;
  active: boolean;
  spreadRateMpm: number; // meters per minute
}

export interface TerrainCell {
  x: number;
  y: number;
  elevation: number;
  slopeDegrees: number;
  vegetationDensity: number; // 0 (rock/water) to 1.0 (dense canopy)
  vegetationType: 'dense_pine' | 'eucalyptus' | 'dry_scrub' | 'grassland' | 'river_buffer';
  fuelMoisturePercent: number;
  burnState: 'unburned' | 'burning' | 'scorched';
}

export interface SignalFeatures {
  thermalRateOfRise: number; // °C/s
  acousticSnr: number; // dB
  acousticCrestFactor: number;
  gasRatio: number; // CO to CO2 ratio
  cusumValue: number;
  cusumThreshold: number;
  kalmanGain: number;
  spectralPeakHz: number;
}

export interface FusionEvidence {
  modality: SensorModality;
  rawConfidence: number; // 0 to 1
  weightedBelief: number; // 0 to 1
  reliabilityWeight: number; // dynamic sensor reliability
  anomalyDetected: boolean;
}

export interface FalseAlarmClassification {
  category: 'genuine_wildfire' | 'campfire_permitted' | 'solar_glare' | 'sensor_drift' | 'chainsaw_activity';
  wildfireProbability: number;
  rejectionReason?: string;
  spectralEvidence: string;
}

export interface AgentReasoningStep {
  step: string;
  finding: string;
  confidence: number;
  actionsTaken?: string[];
  detail?: string;
}

export interface AgentInvestigation {
  investigationId: string;
  timestamp: number;
  triggerNodeId: string;
  threatLevel: 'NOMINAL' | 'WATCH' | 'ADVISORY' | 'CRITICAL_WILDFIRE';
  confidenceScore: number;
  reasoningSteps: AgentReasoningStep[];
  hypothesis: string;
  actionPlan: {
    priority: 'HIGH' | 'URGENT' | 'MONITOR';
    rangerDispatchRecommended: boolean;
    recommendedPerimeterMeters: number;
    containmentStrategy: string;
    sensorNetworkAdjustment: string;
  };
  droneReconActive?: boolean;
  droneCoordinates?: { x: number; y: number };
}

export interface BillOfMaterialsItem {
  component: string;
  unitCost: number;
  quantity: number;
  totalCost: number;
  lifespanYears: number;
  notes: string;
}

export interface OptimizationMetrics {
  algorithm: 'greedy' | 'voronoi' | 'genetic' | 'manual';
  totalNodes: number;
  totalCostUsd: number;
  coveragePercentage: number;
  blindSpotAreaKm2: number;
  redundantCoveragePercentage: number;
  highRiskAreaCoveragePercentage: number;
  averageHopsToGateway: number;
  batteryLifespanYears: number;
  annualMaintenanceCostUsd: number;
}

export interface BenchmarkMetrics {
  name: string;
  detectionLatencySec: number;
  falseAlarmRatePerDay: number;
  precision: number;
  recall: number;
  f1Score: number;
  energyPerSampleMicroJoules: number;
  computeCostPerIncidentUsd: number;
  snrImprovementDb: number;
}

export interface AblationStudyItem {
  configuration: string;
  f1Score: number;
  detectionLatencySec: number;
  falseAlarmRatePerDay: number;
  notes: string;
}

export type NavigationTab = 'intelligence' | 'realworld' | 'optimizer' | 'prototype' | 'research' | 'incidents';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MapsGroundingPlace {
  title: string;
  uri: string;
  address?: string;
  category?: string;
  reviewSnippet?: string;
}

export interface RealWorldLocation {
  id: string;
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  zoom: number;
  riskLevel: 'HIGH' | 'CRITICAL' | 'MODERATE' | 'LOW';
  fwiRating: number;
  vegetationNotes: string;
  fireStationsNearby: { name: string; lat: number; lng: number; distanceKm: number }[];
}

export interface HardwarePinout {
  pin: string;
  esp32Pin: string;
  protocol: 'I2C' | 'SPI' | 'UART' | 'ADC' | 'GPIO' | 'Power';
  description: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  category: 'controller' | 'sensor' | 'communication' | 'power' | 'enclosure' | 'gateway';
  model: string;
  operatingVoltage: string;
  powerDrawActive: string;
  powerDrawSleep: string;
  samplingCadence: string;
  signalRole: string;
  physicalLocation: string;
  pinouts?: HardwarePinout[];
  demoNote: string;
}
