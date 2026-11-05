/**
 * ForestFire Sentinel: Agentic Wildfire Intelligence & Sensor Network Optimization Platform
 * IEEE Ingénieux 2026 Hackathon (Mahindra University)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgentInvestigation, FireSpot, NavigationTab, SensorNode, TerrainCell, WeatherCondition } from './types';
import {
  createDefaultSensorNodes,
  createInitialWeather,
  generateTerrainGrid,
  propagateFires,
  updateSensorsTelemetry,
} from './utils/forestSimulation';
import { runAgentInvestigation } from './utils/agentEngine';
import { Header } from './components/Header';
import { TacticalMap } from './components/TacticalMap';
import { SignalTelemetryPanel } from './components/SignalTelemetryPanel';
import { AgentInvestigationView } from './components/AgentInvestigationView';
import { NetworkOptimizerView } from './components/NetworkOptimizerView';
import { ResearchEvaluationView } from './components/ResearchEvaluationView';
import { IncidentsManagerView } from './components/IncidentsManagerView';
import { HardwarePrototypeView } from './components/HardwarePrototypeView';
import { RealWorldGroundingView } from './components/RealWorldGroundingView';
import { Flame, Activity, Bot, Sliders, ShieldCheck, Compass, Info, ArrowLeft, ArrowRight, Eye, CheckCircle2, Globe } from 'lucide-react';

export default function App() {
  // Hash routing helper
  const parseHash = (): NavigationTab => {
    if (typeof window === 'undefined') return 'intelligence';
    const hash = window.location.hash.replace('#', '');
    if (hash === 'realworld' || hash === 'optimizer' || hash === 'prototype' || hash === 'research' || hash === 'incidents') {
      return hash as NavigationTab;
    }
    return 'intelligence';
  };

  const [activeTab, setActiveTabState] = useState<NavigationTab>(parseHash);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Sync tab with URL hash and browser back/forward history
  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState(null, '', `#${tab}`);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(parseHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  // Core Simulation States
  const [weather, setWeather] = useState<WeatherCondition>(createInitialWeather);
  const [terrainCells] = useState<TerrainCell[]>(generateTerrainGrid);
  const [sensors, setSensors] = useState<SensorNode[]>(createDefaultSensorNodes);
  const [fires, setFires] = useState<FireSpot[]>([
    {
      id: 'IGN-01',
      x: 360,
      y: 350,
      radius: 45,
      intensityMw: 24,
      type: 'wildfire_surface',
      ignitionTime: Date.now() - 30000,
      active: true,
      spreadRateMpm: 8.5,
    },
  ]);

  const [selectedSensorId, setSelectedSensorId] = useState<string | null>('SN-04');
  const [investigation, setInvestigation] = useState<AgentInvestigation | null>(null);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [droneActive, setDroneActive] = useState<boolean>(true);
  const [droneCoordinates, setDroneCoordinates] = useState<{ x: number; y: number }>({ x: 390, y: 320 });

  // Contextual incident inspection state
  const [inspectedIncident, setInspectedIncident] = useState<FireSpot | null>(null);

  // Selected sensor entity
  const selectedSensor = useMemo(() => {
    return sensors.find((s) => s.id === selectedSensorId) || null;
  }, [sensors, selectedSensorId]);

  // Alarmed sensors count
  const activeAlarmCount = useMemo(() => {
    return sensors.filter((s) => s.status === 'alarm' || s.status === 'anomaly').length;
  }, [sensors]);

  // Simulation tick loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1. Propagate active fires
      setFires((prevFires) => propagateFires(prevFires, weather, 1.5));

      // 2. Update sensor telemetry through Kalman & CUSUM filters
      setSensors((prevSensors) => updateSensorsTelemetry(prevSensors, fires, weather));
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning, fires, weather]);

  // Trigger Agent Investigation
  const handleTriggerInvestigation = useCallback(async () => {
    const trigger = selectedSensor || sensors.find((s) => s.status === 'alarm') || sensors[0];
    if (!trigger) return;

    setIsInvestigating(true);
    try {
      const inv = await runAgentInvestigation(trigger, sensors, weather, terrainCells);
      setInvestigation(inv);
      if (inv.droneReconActive && inv.droneCoordinates) {
        setDroneActive(true);
        setDroneCoordinates(inv.droneCoordinates);
      }
    } catch (err) {
      console.error('Agent investigation execution failed:', err);
    } finally {
      setIsInvestigating(false);
    }
  }, [selectedSensor, sensors, weather, terrainCells]);

  // Auto-trigger agent when a new alarm occurs and no investigation is active
  useEffect(() => {
    const alarmed = sensors.find((s) => s.status === 'alarm');
    if (alarmed && !investigation && !isInvestigating) {
      handleTriggerInvestigation();
    }
  }, [sensors, investigation, isInvestigating, handleTriggerInvestigation]);

  // Reset Simulation
  const handleResetSimulation = () => {
    setSensors(createDefaultSensorNodes());
    setFires([]);
    setSelectedSensorId(null);
    setInvestigation(null);
    setDroneActive(false);
    setInspectedIncident(null);
  };

  // Scenario Injectors
  const handleTriggerPresetScenario = (scenario: 'lightning' | 'campfire' | 'solar' | 'crown') => {
    const now = Date.now();
    let newFire: FireSpot;

    if (scenario === 'lightning') {
      newFire = {
        id: `IGN-${now.toString().slice(-4)}`,
        x: 480,
        y: 190,
        radius: 35,
        intensityMw: 32,
        type: 'wildfire_crown',
        ignitionTime: now,
        active: true,
        spreadRateMpm: 14.2,
      };
      setSelectedSensorId('SN-02');
    } else if (scenario === 'campfire') {
      newFire = {
        id: `CMP-${now.toString().slice(-4)}`,
        x: 180,
        y: 570,
        radius: 12,
        intensityMw: 3.5,
        type: 'campfire_safe',
        ignitionTime: now,
        active: true,
        spreadRateMpm: 0.1,
      };
      setSelectedSensorId('SN-07');
    } else if (scenario === 'solar') {
      newFire = {
        id: `GLR-${now.toString().slice(-4)}`,
        x: 780,
        y: 200,
        radius: 20,
        intensityMw: 18,
        type: 'solar_thermal_artifact',
        ignitionTime: now,
        active: true,
        spreadRateMpm: 0.0,
      };
      setSelectedSensorId('SN-03');
    } else {
      newFire = {
        id: `CRW-${now.toString().slice(-4)}`,
        x: 250,
        y: 780,
        radius: 55,
        intensityMw: 65,
        type: 'wildfire_crown',
        ignitionTime: now,
        active: true,
        spreadRateMpm: 22.0,
      };
      setSelectedSensorId('SN-10');
    }

    setFires((prev) => [...prev, newFire]);
    setInspectedIncident(newFire);
  };

  const handleExtinguishFire = (id: string) => {
    setFires((prev) => prev.filter((f) => f.id !== id));
    if (inspectedIncident?.id === id) {
      setInspectedIncident(null);
    }
  };

  // Inspect Incident from Incident List
  const handleInspectIncidentOnMap = (fire: FireSpot) => {
    setInspectedIncident(fire);
    // Find closest sensor
    let nearestId = sensors[0]?.id || 'SN-01';
    let minDist = Infinity;
    for (const s of sensors) {
      const d = Math.hypot(s.x - fire.x, s.y - fire.y);
      if (d < minDist) {
        minDist = d;
        nearestId = s.id;
      }
    }
    setSelectedSensorId(nearestId);
    setActiveTab('intelligence');
  };

  // Optimizer drag & drop handlers
  const handleAddSensor = (x: number, y: number) => {
    const newId = `SN-${String(sensors.length + 1).padStart(2, '0')}`;
    const newSensor: SensorNode = {
      id: newId,
      name: `Custom Node ${sensors.length + 1}`,
      x,
      y,
      elevation: 500,
      zone: 'User Deployed',
      sensingRadius: 135,
      communicationRadius: 300,
      status: 'nominal',
      samplingIntervalSec: 60,
      powerState: 'sleep',
      hardwareCostUsd: 129,
      batteryMah: 3200,
      readings: {
        temperature: weather.ambientTemp,
        humidity: weather.relativeHumidity,
        pm25: 12.0,
        co: 1.1,
        co2: 410,
        acousticDbfs: -54.0,
        acousticCrestFactor: 1.8,
        batteryLevel: 100,
        timestamp: Date.now(),
      },
      rawHistory: [],
      filteredHistory: [],
      cusumValue: 0,
      snrDb: 18.0,
    };
    setSensors((prev) => [...prev, newSensor]);
  };

  const handleMoveSensor = (id: string, x: number, y: number) => {
    setSensors((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
  };

  const handleDeleteSensor = (id: string) => {
    setSensors((prev) => prev.filter((s) => s.id !== id));
    if (selectedSensorId === id) setSelectedSensorId(null);
  };

  // Section title mapping for breadcrumbs
  const sectionTitleMap: Record<NavigationTab, string> = {
    intelligence: 'Wildfire Intelligence (Simulated Reserve)',
    realworld: 'Real-World Geographic Intelligence (Google Maps & Grounding)',
    optimizer: 'Sensor Network Optimizer',
    prototype: 'Proposed Hardware Prototype',
    research: 'Research & Evaluation',
    incidents: 'Tactical Incidents',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isRunning={isRunning}
        onToggleSimulation={() => setIsRunning(!isRunning)}
        onTriggerFireScenario={() => handleTriggerPresetScenario('lightning')}
        onResetSimulation={handleResetSimulation}
        activeAlarmCount={activeAlarmCount}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto p-4 md:p-6 space-y-5">
        {/* Contextual Breadcrumb & System Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/70 border border-slate-800 rounded-lg text-xs">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-slate-400">ForestFire Sentinel</span>
            <span className="text-slate-600">/</span>
            <span className="font-bold text-amber-400">
              {sectionTitleMap[activeTab]}
            </span>
            {activeTab === 'intelligence' && selectedSensor && (
              <>
                <span className="text-slate-600">/</span>
                <span className="font-mono text-slate-200">
                  {selectedSensor.name} ({selectedSensor.id})
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px] flex-wrap">
            {activeTab !== 'realworld' ? (
              <button
                onClick={() => setActiveTab('realworld')}
                className="px-2.5 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-300 font-sans font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
                title="Switch to Real-World Geographic Map with Google Search & Google Maps Grounding"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Real-World Map (Google)</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('intelligence')}
                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-sans font-semibold rounded transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
                title="Return to 1.0 km² simulated forest reserve"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Back to Simulated Reserve</span>
              </button>
            )}

            <span className="hidden sm:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Mesh: {sensors.filter((s) => s.status !== 'offline').length}/{sensors.length} Nodes</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Kalman SNR: +14.8 dB</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Agent: Gemini 3.8 Flash</span>
            </span>
          </div>
        </div>

        {/* Tab 1: Primary Wildfire Intelligence */}
        {activeTab === 'intelligence' && (
          <div className="space-y-4">
            {/* Contextual Incident Inspection Banner (if user navigated from Incidents) */}
            {inspectedIncident && (
              <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">
                      Inspecting Incident {inspectedIncident.id}
                    </span>
                    <span className="text-slate-300 ml-1.5">
                      ({inspectedIncident.type.replace('_', ' ')}) · Location ({inspectedIncident.x.toFixed(0)}m, {inspectedIncident.y.toFixed(0)}m) · Intensity: {inspectedIncident.intensityMw} MW
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    <ArrowLeft className="w-3 h-3 text-amber-400" />
                    <span>Return to Incidents List</span>
                  </button>
                  <button
                    onClick={() => setInspectedIncident(null)}
                    className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px]"
                    title="Dismiss incident banner"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Columns: Tactical Canvas GIS Map */}
              <div className="lg:col-span-7 space-y-4">
                <TacticalMap
                  sensors={sensors}
                  fires={fires}
                  weather={weather}
                  terrainCells={terrainCells}
                  selectedSensorId={selectedSensorId}
                  onSelectSensor={setSelectedSensorId}
                  droneActive={droneActive}
                  droneCoordinates={droneCoordinates}
                />

                {/* Quick Scenario Injector Toolbar */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs flex-wrap">
                  <span className="font-semibold text-slate-300">
                    Scenario Injection:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleTriggerPresetScenario('lightning')}
                      className="px-2.5 py-1 text-xs rounded bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-200 transition-colors cursor-pointer"
                    >
                      Lightning Strike (Outbreak)
                    </button>
                    <button
                      onClick={() => handleTriggerPresetScenario('campfire')}
                      className="px-2.5 py-1 text-xs rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-200 transition-colors cursor-pointer"
                    >
                      Permitted Campfire (False Alarm)
                    </button>
                    <button
                      onClick={() => handleTriggerPresetScenario('solar')}
                      className="px-2.5 py-1 text-xs rounded bg-yellow-950/70 hover:bg-yellow-900 border border-yellow-800 text-yellow-200 transition-colors cursor-pointer"
                    >
                      Solar Rock Glare (Thermal)
                    </button>
                    <button
                      onClick={() => handleTriggerPresetScenario('crown')}
                      className="px-2.5 py-1 text-xs rounded bg-orange-950/70 hover:bg-orange-900 border border-orange-800 text-orange-200 transition-colors cursor-pointer"
                    >
                      Wind-Driven Crown Fire
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 Columns: Signal Processing Oscilloscope & Agentic Console */}
              <div className="lg:col-span-5 space-y-6">
                {/* Agent Investigation Console */}
                <AgentInvestigationView
                  investigation={investigation}
                  triggerNode={selectedSensor}
                  onRunInvestigation={handleTriggerInvestigation}
                  isInvestigating={isInvestigating}
                  onDispatchDrone={() => {
                    setDroneActive(true);
                    if (selectedSensor) {
                      setDroneCoordinates({ x: selectedSensor.x + 30, y: selectedSensor.y - 30 });
                    }
                  }}
                  onApproveActionPlan={() => {
                    alert('Ranger Unit Dispatched: Mahindra Forest Sector containment perimeter established.');
                  }}
                />

                {/* Real-Time Signal Processing & Dempster-Shafer Inspector */}
                <SignalTelemetryPanel
                  sensor={selectedSensor}
                  weather={weather}
                  onClose={() => setSelectedSensorId(null)}
                  onTriggerAgent={handleTriggerInvestigation}
                  onViewInIncidents={() => setActiveTab('incidents')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Real-World Geographic Intelligence with Google Maps & Grounding */}
        {activeTab === 'realworld' && (
          <RealWorldGroundingView onReturnToSimulation={() => setActiveTab('intelligence')} />
        )}

        {/* Tab 2: System B - Sensor Network Optimizer & Deployment Intelligence */}
        {activeTab === 'optimizer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <TacticalMap
                sensors={sensors}
                fires={fires}
                weather={weather}
                terrainCells={terrainCells}
                selectedSensorId={selectedSensorId}
                onSelectSensor={setSelectedSensorId}
                isOptimizerMode={true}
                onAddSensor={handleAddSensor}
                onMoveSensor={handleMoveSensor}
                onDeleteSensor={handleDeleteSensor}
              />
            </div>

            <div className="lg:col-span-5">
              <NetworkOptimizerView
                currentNodes={sensors}
                terrainCells={terrainCells}
                onApplyOptimizedNodes={setSensors}
                onReturnToIntelligence={() => setActiveTab('intelligence')}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Proposed Physical Hardware Prototype Architecture */}
        {activeTab === 'prototype' && (
          <HardwarePrototypeView onNavigateToTab={setActiveTab} />
        )}

        {/* Tab 4: IEEE Hackathon Research & Evaluation Suite */}
        {activeTab === 'research' && <ResearchEvaluationView />}

        {/* Tab 5: Tactical Incidents Management */}
        {activeTab === 'incidents' && (
          <IncidentsManagerView
            fires={fires}
            sensors={sensors}
            weather={weather}
            onExtinguishFire={handleExtinguishFire}
            onTriggerPresetScenario={handleTriggerPresetScenario}
            onSelectSensor={(id) => {
              setSelectedSensorId(id);
              setActiveTab('intelligence');
            }}
            onInspectIncidentOnMap={handleInspectIncidentOnMap}
          />
        )}
      </main>

      {/* Clean Domain Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-400">ForestFire Sentinel</span>
          <span>·</span>
          <span>IEEE Ingénieux 2026 Challenge · Forests & Wildlife Intelligent Sensing</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
          <span>Mahindra University · Track 2</span>
          <span>·</span>
          <button
            onClick={() => setActiveTab('prototype')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            ESP32 Proposed Hardware
          </button>
        </div>
      </footer>
    </div>
  );
}
