/**
 * Interactive Canvas GIS Tactical Map
 * Renders 1000m x 1000m synthetic forest, elevation contours, active fire spots,
 * Huygens spread ellipses, sensor nodes, coverage radiuses, mesh links, wind particles,
 * and autonomous drone reconnaissance flight path.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FireSpot, SensorNode, TerrainCell, WeatherCondition } from '../types';
import { Layers, Compass, Wind, Eye, ShieldAlert, Plus, Trash2 } from 'lucide-react';

interface TacticalMapProps {
  sensors: SensorNode[];
  fires: FireSpot[];
  weather: WeatherCondition;
  terrainCells: TerrainCell[];
  selectedSensorId: string | null;
  onSelectSensor: (sensorId: string | null) => void;
  isOptimizerMode?: boolean;
  onAddSensor?: (x: number, y: number) => void;
  onMoveSensor?: (id: string, x: number, y: number) => void;
  onDeleteSensor?: (id: string) => void;
  droneActive?: boolean;
  droneCoordinates?: { x: number; y: number };
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  sensors,
  fires,
  weather,
  terrainCells,
  selectedSensorId,
  onSelectSensor,
  isOptimizerMode = false,
  onAddSensor,
  onMoveSensor,
  onDeleteSensor,
  droneActive = false,
  droneCoordinates,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Layer toggles
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showMeshLinks, setShowMeshLinks] = useState(true);
  const [showWindParticles, setShowWindParticles] = useState(true);
  const [showBlindSpots, setShowBlindSpots] = useState(false);
  const [showContours, setShowContours] = useState(true);

  // Drag state for optimizer
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [inspectedLocation, setInspectedLocation] = useState<{ x: number; y: number; cell?: TerrainCell } | null>(null);

  // Wind particle buffer
  const particlesRef = useRef<{ x: number; y: number; life: number; speed: number }[]>([]);

  // Initialize wind particles
  useEffect(() => {
    particlesRef.current = Array.from({ length: 45 }, () => ({
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      life: Math.random() * 80,
      speed: 1.5 + Math.random() * 2.0,
    }));
  }, []);

  // Main Canvas Render Loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = width / 1000;

    // 1. Draw Forest Base Ground & Terrain
    ctx.fillStyle = '#09130e'; // deep dark forest floor
    ctx.fillRect(0, 0, width, height);

    // Draw vegetation zones
    for (const cell of terrainCells) {
      const cx = cell.x * scale;
      const cy = cell.y * scale;
      const csize = 20 * scale;

      if (cell.vegetationType === 'river_buffer') {
        ctx.fillStyle = 'rgba(24, 76, 120, 0.45)';
      } else if (cell.vegetationType === 'eucalyptus') {
        ctx.fillStyle = 'rgba(38, 70, 48, 0.55)';
      } else if (cell.vegetationType === 'dry_scrub') {
        ctx.fillStyle = 'rgba(68, 62, 38, 0.50)';
      } else if (cell.vegetationType === 'grassland') {
        ctx.fillStyle = 'rgba(46, 75, 42, 0.35)';
      } else {
        // Dense pine
        ctx.fillStyle = 'rgba(20, 52, 32, 0.60)';
      }
      ctx.fillRect(cx, cy, csize, csize);
    }

    // 2. Draw Topographic Elevation Contours
    if (showContours) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let y = 50; y < 1000; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        for (let x = 0; x <= 1000; x += 50) {
          const elev = Math.sin((x / 1000) * Math.PI) * 120 + Math.cos((y / 1000) * Math.PI) * 80;
          ctx.lineTo(x * scale, (y + elev * 0.15) * scale);
        }
        ctx.stroke();
      }
    }

    // 3. Draw Blind Spots Overlay
    if (showBlindSpots) {
      for (const cell of terrainCells) {
        let isCovered = false;
        for (const s of sensors) {
          const d = Math.hypot(cell.x - s.x, cell.y - s.y);
          if (d <= s.sensingRadius) {
            isCovered = true;
            break;
          }
        }
        if (!isCovered) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
          ctx.fillRect(cell.x * scale, cell.y * scale, 20 * scale, 20 * scale);
        }
      }
    }

    // 4. Draw Thermal IR Heatmap Layer
    if (showHeatmap) {
      for (const fire of fires) {
        if (!fire.active) continue;
        const fx = fire.x * scale;
        const fy = fire.y * scale;
        const fr = (fire.radius + 80) * scale;

        const grad = ctx.createRadialGradient(fx, fy, 4, fx, fy, fr);
        if (fire.type === 'solar_thermal_artifact') {
          grad.addColorStop(0, 'rgba(251, 191, 36, 0.65)');
          grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
          grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        } else if (fire.type === 'campfire_safe') {
          grad.addColorStop(0, 'rgba(249, 115, 22, 0.70)');
          grad.addColorStop(0.4, 'rgba(234, 88, 12, 0.25)');
          grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        } else {
          // Wildfire
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
          grad.addColorStop(0.2, 'rgba(239, 68, 68, 0.75)');
          grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.35)');
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Draw Active Fire Spots & Huygens Spread Ellipse
    const windRad = (weather.windDirection * Math.PI) / 180;
    for (const fire of fires) {
      if (!fire.active) continue;
      const fx = fire.x * scale;
      const fy = fire.y * scale;
      const fr = fire.radius * scale;

      // Draw smoke plume trail downwind
      if (fire.type !== 'solar_thermal_artifact') {
        const plumeLength = 120 * scale;
        const px = fx + Math.sin(windRad) * plumeLength;
        const py = fy - Math.cos(windRad) * plumeLength;

        const smokeGrad = ctx.createLinearGradient(fx, fy, px, py);
        smokeGrad.addColorStop(0, 'rgba(156, 163, 175, 0.45)');
        smokeGrad.addColorStop(1, 'rgba(75, 85, 99, 0)');

        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.arc(px, py, 35 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Huygens Elliptical Spread Contour
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(windRad);
      ctx.strokeStyle = fire.type === 'wildfire_crown' ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      // Ellipse stretched along wind direction
      ctx.ellipse(0, 0, fr * 0.7, fr * 1.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Flame core
      ctx.fillStyle = fire.type === 'solar_thermal_artifact' ? '#f59e0b' : '#ef4444';
      ctx.beginPath();
      ctx.arc(fx, fy, Math.max(5, fr * 0.35), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fx, fy, Math.max(2, fr * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw LoRaWAN Mesh Communication Links between nodes
    if (showMeshLinks) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < sensors.length; i++) {
        for (let j = i + 1; j < sensors.length; j++) {
          const d = Math.hypot(sensors[i].x - sensors[j].x, sensors[i].y - sensors[j].y);
          if (d <= sensors[i].communicationRadius) {
            ctx.beginPath();
            ctx.moveTo(sensors[i].x * scale, sensors[i].y * scale);
            ctx.lineTo(sensors[j].x * scale, sensors[j].y * scale);
            ctx.stroke();
          }
        }
      }
    }

    // 7. Draw Sensor Nodes & Coverage Radiuses
    for (const sensor of sensors) {
      const sx = sensor.x * scale;
      const sy = sensor.y * scale;
      const sr = sensor.sensingRadius * scale;
      const isSelected = sensor.id === selectedSensorId;

      // Draw sensing radius
      if (showCoverage || isSelected) {
        ctx.strokeStyle =
          sensor.status === 'alarm'
            ? 'rgba(239, 68, 68, 0.45)'
            : sensor.status === 'anomaly'
            ? 'rgba(245, 158, 11, 0.35)'
            : isSelected
            ? 'rgba(56, 189, 248, 0.55)'
            : 'rgba(16, 185, 129, 0.20)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Node Outer Glow
      let statusColor = '#10b981'; // nominal emerald
      if (sensor.status === 'alarm') statusColor = '#ef4444'; // alarm red
      else if (sensor.status === 'anomaly') statusColor = '#f59e0b'; // anomaly amber

      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      // Node inner core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, isSelected ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Node text label
      ctx.fillStyle = isSelected ? '#38bdf8' : '#cbd5e1';
      ctx.font = '500 10px JetBrains Mono, monospace';
      ctx.fillText(sensor.id, sx + 8, sy - 6);
    }

    // 8. Draw Wind Vector Particle Stream
    if (showWindParticles) {
      const windSpeed = weather.windSpeed;
      const wRad = (weather.windDirection * Math.PI) / 180;
      const dx = Math.sin(wRad);
      const dy = -Math.cos(wRad);

      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      for (const p of particlesRef.current) {
        p.x += dx * (p.speed * (windSpeed / 15));
        p.y += dy * (p.speed * (windSpeed / 15));
        p.life -= 0.5;

        if (p.x < 0 || p.x > 1000 || p.y < 0 || p.y > 1000 || p.life <= 0) {
          p.x = Math.random() * 1000;
          p.y = Math.random() * 1000;
          p.life = 60 + Math.random() * 40;
        }

        ctx.fillRect(p.x * scale, p.y * scale, 2.5, 2.5);
      }
    }

    // 9. Draw Autonomous Drone Reconnaissance
    if (droneActive && droneCoordinates) {
      const dx = droneCoordinates.x * scale;
      const dy = droneCoordinates.y * scale;

      // Scanning sweep circle
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(dx, dy, 28 * scale, 0, Math.PI * 2);
      ctx.stroke();

      // Drone crosshair
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx - 8, dy);
      ctx.lineTo(dx + 8, dy);
      ctx.moveTo(dx, dy - 8);
      ctx.lineTo(dx, dy + 8);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.fillText('UAV RECON-01', dx + 12, dy + 4);
    }
  }, [
    sensors,
    fires,
    weather,
    terrainCells,
    selectedSensorId,
    showHeatmap,
    showCoverage,
    showMeshLinks,
    showWindParticles,
    showBlindSpots,
    showContours,
    droneActive,
    droneCoordinates,
  ]);

  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      renderCanvas();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [renderCanvas]);

  // Handle canvas clicks & drags
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = 1000 / rect.width;
    const clickX = (e.clientX - rect.left) * scale;
    const clickY = (e.clientY - rect.top) * scale;

    // Check if clicked on a sensor
    const clickedSensor = sensors.find((s) => Math.hypot(s.x - clickX, s.y - clickY) <= 22);

    if (clickedSensor) {
      onSelectSensor(clickedSensor.id);
      if (isOptimizerMode) {
        setDraggedNodeId(clickedSensor.id);
      }
      return;
    }

    // Otherwise inspect terrain cell
    const cell = terrainCells.find((c) => Math.abs(c.x - clickX) < 20 && Math.abs(c.y - clickY) < 20);
    setInspectedLocation({ x: Math.round(clickX), y: Math.round(clickY), cell });

    if (isOptimizerMode && onAddSensor && e.shiftKey) {
      onAddSensor(Math.round(clickX), Math.round(clickY));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isOptimizerMode || !draggedNodeId || !onMoveSensor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = 1000 / rect.width;
    const moveX = Math.round(Math.max(40, Math.min(960, (e.clientX - rect.left) * scale)));
    const moveY = Math.round(Math.max(40, Math.min(960, (e.clientY - rect.top) * scale)));
    onMoveSensor(draggedNodeId, moveX, moveY);
  };

  const handleCanvasMouseUp = () => {
    setDraggedNodeId(null);
  };

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Tactical Canvas Header & Layer Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Biosphere Grid (1.0 km²)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              SIMULATED RESERVE
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span>Wind: {weather.windSpeed} km/h @ {weather.windDirection}°</span>
            <span aria-hidden="true">·</span>
            <span>FWI: {weather.fwi}</span>
          </div>
        </div>

        {/* Layer Toggles Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showHeatmap
                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Thermal Heatmap
          </button>

          <button
            onClick={() => setShowCoverage(!showCoverage)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showCoverage
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Sensor Radiuses
          </button>

          <button
            onClick={() => setShowMeshLinks(!showMeshLinks)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showMeshLinks
                ? 'bg-sky-950/60 border-sky-800 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            LoRaWAN Mesh
          </button>

          <button
            onClick={() => setShowBlindSpots(!showBlindSpots)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showBlindSpots
                ? 'bg-red-950/60 border-red-800 text-red-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Blind Spots
          </button>

          <button
            onClick={() => setShowWindParticles(!showWindParticles)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              showWindParticles
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Wind Flow
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative aspect-square w-full max-h-[640px] bg-slate-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1000}
          height={1000}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          className="w-full h-full object-contain cursor-crosshair"
        />

        {/* Drone Recon Telemetry Overlay Box */}
        {droneActive && droneCoordinates && (
          <div className="absolute top-4 left-4 p-2.5 bg-slate-950/90 border border-sky-600 rounded-md shadow-lg text-xs font-mono text-sky-300 pointer-events-none">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>AUTONOMOUS UAV RECONNAISSANCE</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Target Coord: ({droneCoordinates.x.toFixed(0)}m, {droneCoordinates.y.toFixed(0)}m)
            </div>
            <div className="text-[11px] text-sky-400">
              Optical + Radiometric FLIR Stream: ACTIVE
            </div>
          </div>
        )}

        {/* Inspected Terrain Location Tooltip */}
        {inspectedLocation && inspectedLocation.cell && (
          <div className="absolute bottom-4 left-4 p-2.5 bg-slate-950/90 border border-slate-700 rounded-md text-xs font-mono text-slate-300">
            <div className="font-semibold text-white">
              Terrain Cell ({inspectedLocation.x}m, {inspectedLocation.y}m)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Elev: {inspectedLocation.cell.elevation}m · Slope: {inspectedLocation.cell.slopeDegrees}° · Veg: {inspectedLocation.cell.vegetationType} · Fuel Moisture: {inspectedLocation.cell.fuelMoisturePercent}%
            </div>
          </div>
        )}

        {/* Optimizer Mode Banner */}
        {isOptimizerMode && (
          <div className="absolute top-4 right-4 p-2 bg-amber-950/80 border border-amber-700 rounded text-xs text-amber-200">
            <span>Optimizer Mode: Drag nodes to test coverage. Hold Shift + Click to drop node.</span>
          </div>
        )}
      </div>

      {/* Map Legend Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Nominal Sensor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Anomaly</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Critical Fire Alarm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-sky-400" />
            <span>LoRa Mesh Hop</span>
          </div>
        </div>

        <div className="text-slate-500 font-mono">
          Click node to inspect oscilloscope telemetry
        </div>
      </div>
    </div>
  );
};
