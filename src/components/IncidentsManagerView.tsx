/**
 * Tactical Incidents Management View
 * Displays active fire incidents, false alarm classifications,
 * test scenario injection controls, and containment progress.
 */

import React, { useState } from 'react';
import { FireSpot, SensorNode, WeatherCondition } from '../types';
import { Flame, ShieldAlert, CheckCircle2, AlertTriangle, Wind, Compass, Plus, XCircle, Eye, ArrowRight } from 'lucide-react';

interface IncidentsManagerViewProps {
  fires: FireSpot[];
  sensors: SensorNode[];
  weather: WeatherCondition;
  onExtinguishFire: (id: string) => void;
  onTriggerPresetScenario: (scenario: 'lightning' | 'campfire' | 'solar' | 'crown') => void;
  onSelectSensor: (sensorId: string) => void;
  onInspectIncidentOnMap?: (fire: FireSpot) => void;
}

export const IncidentsManagerView: React.FC<IncidentsManagerViewProps> = ({
  fires,
  sensors,
  weather,
  onExtinguishFire,
  onTriggerPresetScenario,
  onSelectSensor,
  onInspectIncidentOnMap,
}) => {
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<FireSpot | null>(null);

  const activeFires = fires.filter((f) => f.active);
  const alarmedSensors = sensors.filter((s) => s.status === 'alarm');
  const anomalySensors = sensors.filter((s) => s.status === 'anomaly');

  // Helper to find nearest sensor to a fire
  const findNearestSensor = (fire: FireSpot): SensorNode | null => {
    let nearest: SensorNode | null = null;
    let minDist = Infinity;
    for (const s of sensors) {
      const d = Math.hypot(s.x - fire.x, s.y - fire.y);
      if (d < minDist) {
        minDist = d;
        nearest = s;
      }
    }
    return nearest;
  };

  const handleInspect = (fire: FireSpot) => {
    if (onInspectIncidentOnMap) {
      onInspectIncidentOnMap(fire);
    } else {
      const nearest = findNearestSensor(fire);
      if (nearest) onSelectSensor(nearest.id);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col space-y-5 p-5">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Tactical Wildfire Incident Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active thermal signatures, containment perimeters, and test scenario injection.
          </p>
        </div>

        {/* Quick Scenario Injectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1">Inject Test:</span>
          <button
            onClick={() => onTriggerPresetScenario('lightning')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-200 transition-colors cursor-pointer"
          >
            Lightning Strike (Wildfire)
          </button>
          <button
            onClick={() => onTriggerPresetScenario('campfire')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-200 transition-colors cursor-pointer"
          >
            Campfire (False Alarm Test)
          </button>
          <button
            onClick={() => onTriggerPresetScenario('solar')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-yellow-950/70 hover:bg-yellow-900 border border-yellow-800 text-yellow-200 transition-colors cursor-pointer"
          >
            Solar Glare (Rock Glint)
          </button>
          <button
            onClick={() => onTriggerPresetScenario('crown')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-orange-950/70 hover:bg-orange-900 border border-orange-800 text-orange-200 transition-colors cursor-pointer"
          >
            Wind-Driven Crown Fire
          </button>
        </div>
      </div>

      {/* Incident Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">
            Active Thermal Spots
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block tabular-nums">
            {activeFires.length}
          </span>
          <span className="text-[10px] text-slate-500">
            {activeFires.length === 0 ? 'Biosphere All Clear' : 'Active monitoring required'}
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">
            Sensors in Alarm
          </span>
          <span className="text-xl font-bold font-mono text-red-400 mt-0.5 block tabular-nums">
            {alarmedSensors.length}
          </span>
          <span className="text-[10px] text-slate-500">
            CUSUM limit exceeded &gt; 8.0
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">
            Sensors in Anomaly Watch
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block tabular-nums">
            {anomalySensors.length}
          </span>
          <span className="text-[10px] text-slate-500">
            Thermal drift or acoustic spike
          </span>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">
            Fire Weather Index (FWI)
          </span>
          <span className="text-xl font-bold font-mono text-white mt-0.5 block tabular-nums">
            {weather.fwi}
          </span>
          <span className="text-[10px] text-slate-500">
            Wind: {weather.windSpeed} km/h @ {weather.windDirection}°
          </span>
        </div>
      </div>

      {/* Active Incidents List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Detected Thermal Outbreaks & Potential Wildfires
        </h3>

        {activeFires.length === 0 ? (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-slate-300">All Sectors Nominal</p>
            <p className="mt-1 text-slate-500">
              No active thermal anomalies detected across the 1.0 km² sensor mesh. Use the scenario buttons above to inject a simulated wildfire or false-alarm test.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeFires.map((fire) => {
              const isFalseAlarmType =
                fire.type === 'campfire_safe' || fire.type === 'solar_thermal_artifact';
              const nearest = findNearestSensor(fire);

              return (
                <div
                  key={fire.id}
                  className={`p-3.5 bg-slate-950 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-3 ${
                    isFalseAlarmType
                      ? 'border-amber-800/80 bg-amber-950/20'
                      : 'border-red-800/80 bg-red-950/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {fire.type === 'wildfire_crown'
                          ? 'Severe Crown Wildfire Outbreak'
                          : fire.type === 'wildfire_surface'
                          ? 'Spreading Surface Bushfire'
                          : fire.type === 'campfire_safe'
                          ? 'Designated Campsite Fire (Safe)'
                          : 'Solar Thermal Rock Reflection (False Glare)'}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {fire.id}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      Location: ({fire.x.toFixed(0)}m, {fire.y.toFixed(0)}m) · Radiative Power: {fire.intensityMw} MW · Perimeter Radius: {fire.radius}m · Spread Rate: {fire.spreadRateMpm} m/min
                    </div>

                    {nearest && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Nearest Corroborating Sensor: <span className="text-amber-400">{nearest.name} ({nearest.id})</span> · Distance: {Math.round(Math.hypot(nearest.x - fire.x, nearest.y - fire.y))}m
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInspect(fire)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Inspect incident on tactical map and examine AI investigation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect on Map</span>
                    </button>

                    <button
                      onClick={() => setSelectedIncidentModal(fire)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors cursor-pointer text-xs"
                      title="View incident technical breakdown"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => onExtinguishFire(fire.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Extinguish</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Triggered Sensors Corroboration */}
      {(alarmedSensors.length > 0 || anomalySensors.length > 0) && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              Nodes In Anomaly or Alarm State ({alarmedSensors.length + anomalySensors.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Click node to inspect oscilloscope telemetry
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[...alarmedSensors, ...anomalySensors].map((sensor) => (
              <div
                key={sensor.id}
                onClick={() => onSelectSensor(sensor.id)}
                className="p-2.5 bg-slate-950 border border-slate-800 hover:border-amber-700/80 rounded-md cursor-pointer transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5 group-hover:text-amber-400 transition-colors">
                    <span>{sensor.name}</span>
                    <span className="font-mono text-[10px] text-slate-400">({sensor.id})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Temp: {sensor.readings.temperature.toFixed(1)}°C · CUSUM: {sensor.cusumValue.toFixed(2)} · PM2.5: {sensor.readings.pm25.toFixed(0)} µg/m³
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      sensor.status === 'alarm'
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {sensor.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {selectedIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Incident {selectedIncidentModal.id} Telemetry
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncidentModal(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-[10px] text-slate-400 uppercase block">Incident Category</span>
                  <span className="text-white font-bold block mt-0.5 capitalize">
                    {selectedIncidentModal.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-[10px] text-slate-400 uppercase block">Perimeter Radius</span>
                  <span className="text-amber-300 font-bold block mt-0.5">
                    {selectedIncidentModal.radius} meters
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-[10px] text-slate-400 uppercase block">Radiative Power</span>
                  <span className="text-white font-bold block mt-0.5">
                    {selectedIncidentModal.intensityMw} Megawatts
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                  <span className="text-[10px] text-slate-400 uppercase block">Spread Rate</span>
                  <span className="text-red-400 font-bold block mt-0.5">
                    {selectedIncidentModal.spreadRateMpm} m/min
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[11px] leading-relaxed">
                <strong>Huygens Elliptical Spread Model:</strong> Elliptical propagation axis aligned with wind vector ({weather.windSpeed} km/h @ {weather.windDirection}°). Upwind flank spread rate is constrained to {(selectedIncidentModal.spreadRateMpm * 0.25).toFixed(1)} m/min; downwind headfire rate is {selectedIncidentModal.spreadRateMpm} m/min.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  const inc = selectedIncidentModal;
                  setSelectedIncidentModal(null);
                  handleInspect(inc);
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect on Tactical Map</span>
              </button>
              <button
                onClick={() => setSelectedIncidentModal(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
