/**
 * Signal Processing & Telemetry Inspector
 * Visualizes 1D Kalman Filter noise suppression, CUSUM change detector,
 * Acoustic crest factor, and Dempster-Shafer multi-sensor evidence fusion.
 */

import React from 'react';
import { SensorNode, WeatherCondition } from '../types';
import { calculateThermalRateOfRise, extractAcousticFeatures, fuseMultiSensorEvidence } from '../utils/signalProcessing';
import { Activity, ShieldCheck, AlertTriangle, Radio, Zap, Wind, Bot, Flame } from 'lucide-react';

interface SignalTelemetryPanelProps {
  sensor: SensorNode | null;
  weather: WeatherCondition;
  onClose?: () => void;
  onTriggerAgent?: () => void;
  onViewInIncidents?: () => void;
}

export const SignalTelemetryPanel: React.FC<SignalTelemetryPanelProps> = ({
  sensor,
  weather,
  onClose,
  onTriggerAgent,
  onViewInIncidents,
}) => {
  if (!sensor) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400 text-sm">
        <Activity className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="font-medium text-slate-300">No Sensor Node Selected</p>
        <p className="text-xs text-slate-500 mt-1">
          Click any sensor node on the tactical map to inspect its real-time Kalman filtering, CUSUM anomaly accumulator, and multi-sensor evidence fusion.
        </p>
      </div>
    );
  }

  // Calculate signal features for selected sensor
  const thermalRateOfRise = calculateThermalRateOfRise(sensor.filteredHistory);
  const acousticFeatures = extractAcousticFeatures(
    sensor.readings.acousticDbfs,
    sensor.readings.acousticCrestFactor
  );
  const gasRatio = sensor.readings.co / Math.max(380, sensor.readings.co2);

  const signalFeatures = {
    thermalRateOfRise,
    acousticSnr: acousticFeatures.snrDb,
    acousticCrestFactor: sensor.readings.acousticCrestFactor,
    gasRatio,
    cusumValue: sensor.cusumValue,
    cusumThreshold: 4.5,
    kalmanGain: 0.18,
    spectralPeakHz: acousticFeatures.isCombustionPattern ? 3200 : 450,
  };

  const fusion = fuseMultiSensorEvidence(sensor.readings, signalFeatures, weather.ambientTemp);

  // Time-series rendering math for SVG graph
  const rawData = sensor.rawHistory.slice(-15);
  const filteredData = sensor.filteredHistory.slice(-15);

  const minTemp = Math.min(...rawData.map((d) => d.temp), weather.ambientTemp - 2);
  const maxTemp = Math.max(...rawData.map((d) => d.temp), weather.ambientTemp + 10, 35);
  const tempRange = Math.max(5, maxTemp - minTemp);

  const graphWidth = 320;
  const graphHeight = 100;

  const getSvgY = (temp: number) => {
    const norm = (temp - minTemp) / tempRange;
    return graphHeight - norm * (graphHeight - 12) - 6;
  };

  const getSvgX = (index: number, total: number) => {
    return (index / Math.max(1, total - 1)) * graphWidth;
  };

  const rawPath = rawData
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(i, rawData.length)} ${getSvgY(pt.temp)}`)
    .join(' ');

  const filteredPath = filteredData
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getSvgX(i, filteredData.length)} ${getSvgY(pt.temp)}`)
    .join(' ');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{sensor.name}</span>
              <span className="font-mono text-xs text-slate-400">({sensor.id})</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Zone: {sensor.zone} · Elev: {sensor.elevation}m · Mesh Hop: 1 · Battery: {sensor.readings.batteryLevel.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 text-xs font-semibold rounded font-mono uppercase ${
              sensor.status === 'alarm'
                ? 'bg-red-950 text-red-400 border border-red-800'
                : sensor.status === 'anomaly'
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}
          >
            {sensor.status}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Oscilloscope Graph: Raw vs Kalman Filtered Temperature */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-200">
              Discrete 1D Kalman Filter Noise Decoupling
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-slate-500 inline-block" /> Raw Noisy
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> Kalman Filtered
              </span>
              <span className="text-sky-400">SNR: +{sensor.snrDb} dB</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-2">
            <svg
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              className="w-full h-24 overflow-visible"
            >
              {/* Baseline ambient line */}
              <line
                x1="0"
                y1={getSvgY(weather.ambientTemp)}
                x2={graphWidth}
                y2={getSvgY(weather.ambientTemp)}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeDasharray="3,3"
              />

              {/* Raw measurement noisy trace */}
              <path
                d={rawPath}
                fill="none"
                stroke="rgba(148, 163, 184, 0.45)"
                strokeWidth="1.2"
              />

              {/* Kalman estimated state trace */}
              <path
                d={filteredPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
              />
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>-30s</span>
              <span>Ambient Baseline: {weather.ambientTemp}°C</span>
              <span>Current: {sensor.readings.temperature.toFixed(1)}°C (Rate: +{thermalRateOfRise.toFixed(2)}°C/s)</span>
            </div>
          </div>
        </div>

        {/* Signal Feature Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 bg-slate-950 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-400 uppercase font-mono">CUSUM Metric (h=4.5)</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {sensor.cusumValue.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500">
              {sensor.cusumValue > 4.5 ? 'Threshold Exceeded' : 'Statistical Baseline'}
            </div>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Acoustic Crackle</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {acousticFeatures.snrDb.toFixed(1)} dB
            </div>
            <div className="text-[10px] text-slate-500">
              Crest Factor: {sensor.readings.acousticCrestFactor.toFixed(2)}
            </div>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Chemical Gas CO/CO2</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {sensor.readings.co.toFixed(2)} ppm
            </div>
            <div className="text-[10px] text-slate-500">
              CO/CO2 Ratio: {(gasRatio * 1000).toFixed(1)}‰
            </div>
          </div>

          <div className="p-2 bg-slate-950 border border-slate-800 rounded">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Particulates PM2.5</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {sensor.readings.pm25.toFixed(1)} µg/m³
            </div>
            <div className="text-[10px] text-slate-500">
              Sampling: {sensor.samplingIntervalSec}s ({sensor.powerState})
            </div>
          </div>
        </div>

        {/* Dempster-Shafer Multi-Sensor Evidence Fusion */}
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-200">
              Dempster-Shafer Multi-Sensor Belief Fusion
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Fused Wildfire Belief: {(fusion.fusedFireBelief * 100).toFixed(1)}%
            </span>
          </div>

          <div className="space-y-1.5">
            {fusion.evidenceList.map((ev) => (
              <div key={ev.modality} className="space-y-0.5">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span className="capitalize">{ev.modality.replace('_', ' ')}</span>
                  <span className="font-mono text-slate-400">
                    Confidence: {(ev.rawConfidence * 100).toFixed(0)}% · Weight: {ev.reliabilityWeight}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      ev.anomalyDetected ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, ev.rawConfidence * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* False Alarm Discrimination Box */}
        <div
          className={`p-3 rounded-lg border text-xs ${
            fusion.classification.category === 'genuine_wildfire'
              ? 'bg-red-950/40 border-red-800 text-red-200'
              : fusion.classification.category === 'campfire_permitted'
              ? 'bg-amber-950/30 border-amber-800 text-amber-200'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {fusion.classification.category === 'genuine_wildfire' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="capitalize">
              Diagnostic Classification: {fusion.classification.category.replace('_', ' ')}
            </span>
            <span className="font-mono text-[11px] ml-auto">
              Prob: {(fusion.classification.wildfireProbability * 100).toFixed(0)}%
            </span>
          </div>

          {fusion.classification.rejectionReason && (
            <p className="mt-1 text-[11px] text-slate-400">
              <strong className="text-slate-300">Rejection Rationale:</strong> {fusion.classification.rejectionReason}
            </p>
          )}

          <p className="mt-1 text-[11px] text-slate-400">
            <strong className="text-slate-300">Spectral Evidence:</strong> {fusion.classification.spectralEvidence}
          </p>
        </div>

        {/* Contextual Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
          {onTriggerAgent && (
            <button
              onClick={onTriggerAgent}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Launch autonomous multi-step agent reasoning on this node"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Investigate Node With Agent</span>
            </button>
          )}

          {sensor.status !== 'nominal' && onViewInIncidents && (
            <button
              onClick={onViewInIncidents}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
              title="View active incidents and containment"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>View in Incidents</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
