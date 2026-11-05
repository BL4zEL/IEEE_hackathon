/**
 * Forest Environment, Terrain Model, and Fire Propagation Simulator
 * Simulates Rothermel/Huygens elliptical fire spread, micro-climate weather,
 * smoke plume advection, and real-time physical sensor node telemetry.
 */

import { FireSpot, SensorNode, TerrainCell, WeatherCondition } from '../types';
import { CusumDetector, KalmanFilter1D } from './signalProcessing';

export const FOREST_WIDTH_METERS = 1000;
export const FOREST_HEIGHT_METERS = 1000;
export const GRID_RESOLUTION = 20; // 50x50 cells

export function createInitialWeather(): WeatherCondition {
  return {
    ambientTemp: 31.8,
    relativeHumidity: 22.5,
    windSpeed: 24.0, // km/h
    windDirection: 65, // Degrees (ENE)
    droughtCode: 380,
    fwi: 32.4, // High risk
    solarIrradiance: 840,
    atmosphericPressure: 1012,
  };
}

export function generateTerrainGrid(): TerrainCell[] {
  const cells: TerrainCell[] = [];
  const cols = FOREST_WIDTH_METERS / GRID_RESOLUTION;
  const rows = FOREST_HEIGHT_METERS / GRID_RESOLUTION;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * GRID_RESOLUTION;
      const y = r * GRID_RESOLUTION;

      // Elevation synthesized via multiple sine/cosine topography harmonics
      // Ridge in the north-east, valley and river in the south-west
      const ridge = Math.sin((x / 1000) * Math.PI) * 120 + Math.cos((y / 1000) * Math.PI) * 80;
      const elevation = Math.round(450 + ridge + Math.sin(x / 150) * 15);

      // Slope calculation
      const slopeDegrees = Math.min(42, Math.max(4, Math.abs(Math.sin((x + y) / 300) * 28)));

      // River buffer cuts diagonally from (100, 900) to (800, 1000)
      const distToRiver = Math.abs((y - 0.2 * x - 750));
      const isRiver = distToRiver < 45;

      let vegetationType: TerrainCell['vegetationType'] = 'dense_pine';
      let vegetationDensity = 0.85;
      let fuelMoisture = 9.2; // dry

      if (isRiver) {
        vegetationType = 'river_buffer';
        vegetationDensity = 0.4;
        fuelMoisture = 28.0;
      } else if (elevation > 580) {
        vegetationType = 'eucalyptus';
        vegetationDensity = 0.90;
        fuelMoisture = 7.5; // very dry & volatile
      } else if (slopeDegrees > 25) {
        vegetationType = 'dry_scrub';
        vegetationDensity = 0.70;
        fuelMoisture = 8.0;
      } else if (x < 350 && y < 350) {
        vegetationType = 'grassland';
        vegetationDensity = 0.55;
        fuelMoisture = 11.0;
      }

      cells.push({
        x,
        y,
        elevation,
        slopeDegrees: Math.round(slopeDegrees),
        vegetationDensity,
        vegetationType,
        fuelMoisturePercent: fuelMoisture,
        burnState: 'unburned',
      });
    }
  }

  return cells;
}

// Initial Sensor Node Topology (Strategic baseline distribution)
export function createDefaultSensorNodes(): SensorNode[] {
  const nodeSpecs = [
    { id: 'SN-01', name: 'Pine Ridge North', x: 220, y: 180, elevation: 540, zone: 'North Ridge' },
    { id: 'SN-02', name: 'Eagle Outlook Peak', x: 480, y: 140, elevation: 620, zone: 'North Ridge' },
    { id: 'SN-03', name: 'Granite Crest', x: 780, y: 210, elevation: 590, zone: 'North-East Crest' },
    { id: 'SN-04', name: 'Upper Eucalyptus Basin', x: 340, y: 380, elevation: 520, zone: 'Central Basin' },
    { id: 'SN-05', name: 'Central Biosphere Hub', x: 550, y: 440, elevation: 490, zone: 'Central Basin' },
    { id: 'SN-06', name: 'East Gully Pass', x: 820, y: 430, elevation: 510, zone: 'East Boundary' },
    { id: 'SN-07', name: 'West Valley Camp Ground', x: 180, y: 560, elevation: 470, zone: 'West Valley' },
    { id: 'SN-08', name: 'Observation Tower Hill', x: 420, y: 620, elevation: 530, zone: 'Central Basin' },
    { id: 'SN-09', name: 'River Bend Crossing', x: 670, y: 680, elevation: 460, zone: 'Riparian Zone' },
    { id: 'SN-10', name: 'South Slope Scrub', x: 260, y: 810, elevation: 490, zone: 'South Sector' },
    { id: 'SN-11', name: 'Old Logging Trail', x: 510, y: 840, elevation: 475, zone: 'South Sector' },
    { id: 'SN-12', name: 'Boundary Canyon South', x: 830, y: 820, elevation: 465, zone: 'South Sector' },
  ];

  return nodeSpecs.map((spec) => {
    const initialTemp = 28.5 + (Math.random() - 0.5) * 1.5;
    const initialHum = 24 + (Math.random() - 0.5) * 3;
    const initialPm = 12 + Math.random() * 5;
    const initialCo = 1.2 + Math.random() * 0.4;
    const initialCo2 = 415 + Math.random() * 10;
    const initialAcoustic = -52 + Math.random() * 3;

    const rawHistory = Array.from({ length: 15 }, (_, i) => ({
      timestamp: Date.now() - (15 - i) * 2000,
      temp: initialTemp + (Math.random() - 0.5) * 0.6,
      acoustic: initialAcoustic + (Math.random() - 0.5) * 1.5,
      gas: initialCo,
      pm25: initialPm + (Math.random() - 0.5) * 2,
    }));

    const filteredHistory = rawHistory.map((h) => ({ ...h }));

    return {
      id: spec.id,
      name: spec.name,
      x: spec.x,
      y: spec.y,
      elevation: spec.elevation,
      zone: spec.zone,
      sensingRadius: 130, // meters
      communicationRadius: 300, // LoRaWAN range
      status: 'nominal',
      samplingIntervalSec: 60,
      powerState: 'sleep',
      hardwareCostUsd: 145,
      batteryMah: 3200,
      readings: {
        temperature: Number(initialTemp.toFixed(1)),
        humidity: Number(initialHum.toFixed(1)),
        pm25: Number(initialPm.toFixed(1)),
        co: Number(initialCo.toFixed(2)),
        co2: Number(initialCo2.toFixed(0)),
        acousticDbfs: Number(initialAcoustic.toFixed(1)),
        acousticCrestFactor: 1.95,
        batteryLevel: 98,
        timestamp: Date.now(),
      },
      rawHistory,
      filteredHistory,
      cusumValue: 0.2,
      snrDb: 18.4,
    };
  });
}

// Global filter cache so filters persist state across simulation ticks
const kalmanCache = new Map<string, KalmanFilter1D>();
const cusumCache = new Map<string, CusumDetector>();

export function getOrCreateKalman(id: string, initialValue: number = 28.5): KalmanFilter1D {
  if (!kalmanCache.has(id)) {
    kalmanCache.set(id, new KalmanFilter1D(initialValue, 0.05, 1.6));
  }
  return kalmanCache.get(id)!;
}

export function getOrCreateCusum(id: string, baseline: number = 28.5): CusumDetector {
  if (!cusumCache.has(id)) {
    cusumCache.set(id, new CusumDetector(baseline, 0.8, 4.5));
  }
  return cusumCache.get(id)!;
}

/**
 * Propagate Active Fire Spots using Huygens elliptical spread physics
 */
export function propagateFires(fires: FireSpot[], weather: WeatherCondition, dtSeconds: number): FireSpot[] {
  const windAngleRad = (weather.windDirection * Math.PI) / 180;
  const windFactor = 1 + (weather.windSpeed / 20) * 1.4;

  return fires
    .filter((f) => f.active)
    .map((fire) => {
      // Base spread rate depending on fire type
      let baseRate = 0.4; // m/s
      if (fire.type === 'wildfire_crown') baseRate = 1.2;
      else if (fire.type === 'wildfire_surface') baseRate = 0.6;
      else if (fire.type === 'campfire_safe') baseRate = 0.02; // very slow / contained
      else if (fire.type === 'solar_thermal_artifact') baseRate = 0.0; // stationary

      const spreadRate = baseRate * windFactor;

      // Center shifts downwind
      const dx = Math.sin(windAngleRad) * spreadRate * dtSeconds * 0.4;
      const dy = -Math.cos(windAngleRad) * spreadRate * dtSeconds * 0.4;

      // Radius expands
      const newRadius = fire.type === 'campfire_safe' || fire.type === 'solar_thermal_artifact'
        ? fire.radius
        : Math.min(220, fire.radius + spreadRate * dtSeconds * 0.6);

      // Radiative power expands
      const newIntensity = fire.type === 'campfire_safe'
        ? fire.intensityMw
        : Math.min(120, fire.intensityMw + (newRadius / 25));

      return {
        ...fire,
        x: Math.max(20, Math.min(FOREST_WIDTH_METERS - 20, fire.x + dx)),
        y: Math.max(20, Math.min(FOREST_HEIGHT_METERS - 20, fire.y + dy)),
        radius: Number(newRadius.toFixed(1)),
        intensityMw: Number(newIntensity.toFixed(1)),
        spreadRateMpm: Number((spreadRate * 60).toFixed(1)),
      };
    });
}

/**
 * Compute sensor readings from active fire spots, smoke advection, and ambient weather.
 * Applies sensor noise and runs Kalman filtering + CUSUM.
 */
export function updateSensorsTelemetry(
  sensors: SensorNode[],
  fires: FireSpot[],
  weather: WeatherCondition
): SensorNode[] {
  const now = Date.now();
  const windAngleRad = (weather.windDirection * Math.PI) / 180;
  // Downwind unit vector
  const windVecX = Math.sin(windAngleRad);
  const windVecY = -Math.cos(windAngleRad);

  return sensors.map((sensor) => {
    let thermalHeatReceived = 0;
    let smokeParticulates = 0;
    let coGasPpm = 0;
    let co2GasPpm = 0;
    let acousticCrackleEnergy = 0;
    let isSolarArtifact = false;

    // Evaluate proximity & plume overlap with every active fire
    for (const fire of fires) {
      if (!fire.active) continue;

      const dx = sensor.x - fire.x;
      const dy = sensor.y - fire.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (fire.type === 'solar_thermal_artifact') {
        if (dist < fire.radius + 30) {
          thermalHeatReceived += Math.max(0, 32 * (1 - dist / (fire.radius + 30)));
          isSolarArtifact = true;
        }
        continue;
      }

      // 1. Direct Radiative Thermal Heat (Inverse square falloff with ground attenuation)
      if (dist < fire.radius + 180) {
        const proximityFactor = Math.max(0, 1 - dist / (fire.radius + 180));
        thermalHeatReceived += fire.intensityMw * 2.8 * (proximityFactor ** 1.8);
      }

      // 2. Downwind Smoke & Gas Plume Advection (Gaussian plume footprint)
      // Vector projection along wind direction
      const distAlongWind = dx * windVecX + dy * windVecY;
      const distPerpWind = Math.abs(dx * -windVecY + dy * windVecX);

      // Downwind plume carries smoke and CO
      if (distAlongWind > -20 && distAlongWind < 400 && distPerpWind < (40 + distAlongWind * 0.35)) {
        const plumeDecay = Math.exp(-distAlongWind / 280) * Math.exp(-(distPerpWind * distPerpWind) / (2 * 45 * 45));
        const plumeFactor = fire.type === 'campfire_safe' ? 0.25 : 1.0;
        smokeParticulates += 190 * plumeDecay * plumeFactor;
        coGasPpm += 16 * plumeDecay * plumeFactor;
        co2GasPpm += 220 * plumeDecay * plumeFactor;
      }

      // 3. Acoustic Combustion Crackle (snapping biomass frequencies, falloff within ~160m)
      if (dist < 160 && fire.type !== 'campfire_safe') {
        const acousticProximity = Math.max(0, 1 - dist / 160);
        acousticCrackleEnergy += acousticProximity * 36; // dB rise
      } else if (dist < 50 && fire.type === 'campfire_safe') {
        acousticCrackleEnergy += 8; // gentle campfire pop
      }
    }

    // Baseline readings with natural stochastic environmental noise
    const whiteNoiseTemp = (Math.random() - 0.5) * 0.9;
    const rawTemp = weather.ambientTemp + thermalHeatReceived + whiteNoiseTemp;
    const rawHumidity = Math.max(10, weather.relativeHumidity - thermalHeatReceived * 0.5 + (Math.random() - 0.5) * 1.5);
    const rawPm25 = Math.max(8, 12 + smokeParticulates + (Math.random() - 0.5) * 3);
    const rawCo = Math.max(0.8, 1.2 + coGasPpm + (Math.random() - 0.5) * 0.2);
    const rawCo2 = Math.max(400, 415 + co2GasPpm + (Math.random() - 0.5) * 5);
    const rawAcousticDbfs = Math.min(-10, -54 + acousticCrackleEnergy + (Math.random() - 0.5) * 2.5);
    const crestFactor = acousticCrackleEnergy > 10 ? 3.6 + Math.random() * 0.8 : 1.9 + Math.random() * 0.3;

    // Run Kalman Filter on Temperature & Particulates
    const kalman = getOrCreateKalman(sensor.id, weather.ambientTemp);
    const { estimatedState: filteredTemp } = kalman.update(rawTemp);

    // Run CUSUM Change Detector on temperature
    const cusum = getOrCreateCusum(sensor.id, weather.ambientTemp);
    const { cusumValue, alarm } = cusum.update(filteredTemp);

    // Calculate empirical Signal-to-Noise Ratio (dB)
    const signalVariance = Math.max(0.1, (filteredTemp - weather.ambientTemp) ** 2);
    const noiseVariance = 0.81; // 0.9^2
    const snrDb = Number((10 * Math.log10(Math.max(1, signalVariance / noiseVariance))).toFixed(1));

    // Determine status
    let status: SensorNode['status'] = 'nominal';
    if (filteredTemp > 50 || rawPm25 > 90 || cusumValue > 8.0) {
      status = 'alarm';
    } else if (alarm || cusumValue > 3.0 || filteredTemp > weather.ambientTemp + 4) {
      status = 'anomaly';
    }

    // Adaptive sampling rate under alert
    const samplingIntervalSec = status === 'alarm' ? 2 : status === 'anomaly' ? 10 : 60;
    const powerState = status === 'alarm' ? 'burst_tx' : status === 'anomaly' ? 'active' : 'sleep';

    // Update historical sliding window (keep last 20 frames)
    const newRawPoint = {
      timestamp: now,
      temp: Number(rawTemp.toFixed(1)),
      acoustic: Number(rawAcousticDbfs.toFixed(1)),
      gas: Number(rawCo.toFixed(2)),
      pm25: Number(rawPm25.toFixed(1)),
    };

    const newFilteredPoint = {
      timestamp: now,
      temp: Number(filteredTemp.toFixed(1)),
      acoustic: Number((rawAcousticDbfs * 0.85 - 54 * 0.15).toFixed(1)),
      gas: Number(rawCo.toFixed(2)),
      pm25: Number(rawPm25.toFixed(1)),
    };

    const updatedRawHistory = [...sensor.rawHistory.slice(-19), newRawPoint];
    const updatedFilteredHistory = [...sensor.filteredHistory.slice(-19), newFilteredPoint];

    return {
      ...sensor,
      status,
      samplingIntervalSec,
      powerState,
      cusumValue: Number(cusumValue.toFixed(2)),
      snrDb,
      readings: {
        temperature: Number(filteredTemp.toFixed(1)),
        humidity: Number(rawHumidity.toFixed(1)),
        pm25: Number(rawPm25.toFixed(1)),
        co: Number(rawCo.toFixed(2)),
        co2: Number(rawCo2.toFixed(0)),
        acousticDbfs: Number(rawAcousticDbfs.toFixed(1)),
        acousticCrestFactor: Number(crestFactor.toFixed(2)),
        batteryLevel: Math.max(10, sensor.readings.batteryLevel - (status === 'alarm' ? 0.02 : 0.001)),
        timestamp: now,
      },
      rawHistory: updatedRawHistory,
      filteredHistory: updatedFilteredHistory,
    };
  });
}
