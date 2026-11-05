/**
 * Sensor Network Optimization & Deployment Intelligence (System B)
 * Interactive algorithm configuration, coverage vs cost trade-offs,
 * Bill of Materials (BOM) calculator, and network reliability simulation.
 */

import React, { useState } from 'react';
import { BillOfMaterialsItem, OptimizationMetrics, SensorNode, TerrainCell } from '../types';
import {
  calculateBillOfMaterials,
  evaluateCoverageMetrics,
  runGeneticOptimization,
  runGreedyOptimization,
  runVoronoiOptimization,
} from '../utils/networkOptimizer';
import { Network, Sliders, DollarSign, BatteryCharging, AlertTriangle, Cpu, Check, RefreshCw, ArrowLeft, Play } from 'lucide-react';

interface NetworkOptimizerViewProps {
  currentNodes: SensorNode[];
  terrainCells: TerrainCell[];
  onApplyOptimizedNodes: (nodes: SensorNode[]) => void;
  onReturnToIntelligence?: () => void;
}

export const NetworkOptimizerView: React.FC<NetworkOptimizerViewProps> = ({
  currentNodes,
  terrainCells,
  onApplyOptimizedNodes,
  onReturnToIntelligence,
}) => {
  const [algorithm, setAlgorithm] = useState<'greedy' | 'voronoi' | 'genetic'>('greedy');
  const [targetNodeCount, setTargetNodeCount] = useState<number>(currentNodes.length || 12);
  const [sensingRadius, setSensingRadius] = useState<number>(135);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'kpis' | 'bom' | 'reliability'>('kpis');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Evaluate current metrics
  const currentMetrics = evaluateCoverageMetrics(currentNodes, terrainCells, 'manual');
  const bom = calculateBillOfMaterials(currentNodes.length);

  const handleRunOptimizer = (andReturnToSim: boolean = false) => {
    setIsOptimizing(true);
    setTimeout(() => {
      let optimized: SensorNode[] = [];
      if (algorithm === 'greedy') {
        optimized = runGreedyOptimization(targetNodeCount, terrainCells, sensingRadius);
      } else if (algorithm === 'voronoi') {
        optimized = runVoronoiOptimization(currentNodes, terrainCells, sensingRadius);
      } else {
        optimized = runGeneticOptimization(targetNodeCount, terrainCells, sensingRadius);
      }
      onApplyOptimizedNodes(optimized);
      setIsOptimizing(false);
      setAppliedNotification(`Optimized topology with ${optimized.length} nodes successfully generated!`);
      setTimeout(() => setAppliedNotification(null), 3500);

      if (andReturnToSim && onReturnToIntelligence) {
        onReturnToIntelligence();
      }
    }, 400);
  };

  const handleSimulateNodeFailures = () => {
    // Inject 20% random node failure
    const modified = currentNodes.map((n) => {
      const fails = Math.random() < 0.2;
      return fails ? { ...n, status: 'offline' as const, powerState: 'sleep' as const } : n;
    });
    onApplyOptimizedNodes(modified);
  };

  const handleRestoreAllNodes = () => {
    const restored = currentNodes.map((n) => ({
      ...n,
      status: 'nominal' as const,
      powerState: 'sleep' as const,
    }));
    onApplyOptimizedNodes(restored);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Optimizer Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Network className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-sm font-bold text-white">
              Sensor Network Deployment & Cost Optimization (System B)
            </h2>
            <p className="text-[11px] text-slate-400">
              Heuristic & Multi-Objective algorithms to minimize blind spots and deployment CAPEX
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onReturnToIntelligence && (
            <button
              onClick={onReturnToIntelligence}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 rounded transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back to Intelligence</span>
            </button>
          )}

          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('kpis')}
              className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'kpis' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coverage & KPIs
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'bom' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bill of Materials (BOM)
            </button>
            <button
              onClick={() => setActiveTab('reliability')}
              className={`px-3 py-1 font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'reliability' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fault Tolerance
            </button>
          </div>
        </div>
      </div>

      {appliedNotification && (
        <div className="mx-4 mt-3 p-2.5 bg-emerald-950/80 border border-emerald-700 rounded text-xs text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appliedNotification}</span>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Optimizer Control Bar */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Algorithm Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 block">
                Optimization Algorithm
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setAlgorithm('greedy')}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                    algorithm === 'greedy'
                      ? 'bg-amber-950 border-amber-700 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Greedy Max-Coverage
                </button>
                <button
                  onClick={() => setAlgorithm('voronoi')}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                    algorithm === 'voronoi'
                      ? 'bg-amber-950 border-amber-700 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Voronoi Centroidal
                </button>
                <button
                  onClick={() => setAlgorithm('genetic')}
                  className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                    algorithm === 'genetic'
                      ? 'bg-amber-950 border-amber-700 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Multi-Objective Genetic
                </button>
              </div>
            </div>

            {/* Target Node Count Slider */}
            <div className="space-y-1 min-w-[140px]">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Node Count Budget:</span>
                <span className="font-mono text-white font-bold">{targetNodeCount}</span>
              </div>
              <input
                type="range"
                min={6}
                max={24}
                value={targetNodeCount}
                onChange={(e) => setTargetNodeCount(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Sensing Radius Slider */}
            <div className="space-y-1 min-w-[140px]">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Sensing Radius:</span>
                <span className="font-mono text-white font-bold">{sensingRadius}m</span>
              </div>
              <input
                type="range"
                min={90}
                max={180}
                step={5}
                value={sensingRadius}
                onChange={(e) => setSensingRadius(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end flex-wrap">
              <button
                onClick={() => handleRunOptimizer(false)}
                disabled={isOptimizing}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Cpu className={`w-3.5 h-3.5 text-amber-400 ${isOptimizing ? 'animate-spin' : ''}`} />
                <span>{isOptimizing ? 'Computing...' : 'Compute Topology'}</span>
              </button>

              <button
                onClick={() => handleRunOptimizer(true)}
                disabled={isOptimizing}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-sm"
              >
                <Play className="w-3.5 h-3.5 text-amber-200" />
                <span>Apply & Test Live</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Coverage & KPIs */}
        {activeTab === 'kpis' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Forest Area Coverage
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block tabular-nums">
                  {currentMetrics.coveragePercentage}%
                </span>
                <span className="text-[10px] text-slate-500">
                  Total monitored biosphere
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  High-Risk Sector Protection
                </span>
                <span className="text-xl font-bold font-mono text-white mt-0.5 block tabular-nums">
                  {currentMetrics.highRiskAreaCoveragePercentage}%
                </span>
                <span className="text-[10px] text-slate-500">
                  Steep dry eucalyptus zones
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Unmonitored Blind Spots
                </span>
                <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block tabular-nums">
                  {currentMetrics.blindSpotAreaKm2} km²
                </span>
                <span className="text-[10px] text-slate-500">
                  Dead zones outside radius
                </span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">
                  Hardware CAPEX
                </span>
                <span className="text-xl font-bold font-mono text-sky-400 mt-0.5 block tabular-nums">
                  ${currentMetrics.totalCostUsd.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500">
                  Sensors + Gateways + Rigging
                </span>
              </div>
            </div>

            {/* Strategic Deployment Recommendations */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1.5">
              <div className="font-semibold text-slate-200">
                Forest Operator Deployment Intelligence
              </div>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li>
                  <strong>Topographic Ridge Placement:</strong> Nodes on Eagle Outlook Peak and Granite Crest serve as natural line-of-sight relays, reducing LoRa mesh hops to {currentMetrics.averageHopsToGateway} hops.
                </li>
                <li>
                  <strong>Chimney Updraft Risk:</strong> High slope gradient (28°) in the eastern gully accelerates fire spread rate; algorithm prioritized 2x sensor density downwind of that corridor.
                </li>
                <li>
                  <strong>Battery Life Projection:</strong> Integrated 0.5W solar micro-panel with LiFePO4 cells yields an estimated <strong>{currentMetrics.batteryLifespanYears} years</strong> of autonomous field operation before servicing.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Bill of Materials (BOM) */}
        {activeTab === 'bom' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Component</th>
                    <th className="px-3 py-2 text-right">Unit ($)</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Total ($)</th>
                    <th className="px-3 py-2 text-right">Lifespan</th>
                    <th className="px-3 py-2">Engineering Specification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {bom.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/40">
                      <td className="px-3 py-2 font-medium text-slate-200">{item.component}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-300 tabular-nums">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-300 tabular-nums">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-white tabular-nums">
                        ${item.totalCost.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400 tabular-nums">
                        {item.lifespanYears} yrs
                      </td>
                      <td className="px-3 py-2 text-slate-400 text-[11px]">{item.notes}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950/90 font-bold border-t-2 border-slate-700">
                    <td className="px-3 py-2.5 text-white" colSpan={3}>
                      Total Estimated Deployment CAPEX:
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-400 text-sm tabular-nums">
                      ${currentMetrics.totalCostUsd.toLocaleString()}
                    </td>
                    <td colSpan={2} className="px-3 py-2.5 text-slate-400 text-[11px]">
                      Annual Maintenance OPEX: ~${currentMetrics.annualMaintenanceCostUsd}/yr
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Fault Tolerance & Reliability Simulation */}
        {activeTab === 'reliability' && (
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-3">
            <div>
              <h3 className="font-semibold text-white">
                LoRaWAN Mesh Resilience & Node Failure Stress Testing
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Simulate tree canopy radio attenuation, physical fire damage, or dead batteries to test self-healing mesh topology.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateNodeFailures}
                className="px-3 py-1.5 bg-red-950 border border-red-800 hover:bg-red-900 text-red-300 font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Inject 20% Random Node Outage</span>
              </button>

              <button
                onClick={handleRestoreAllNodes}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-medium rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore All Nodes to Nominal</span>
              </button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded space-y-1">
              <div className="text-[11px] font-semibold text-slate-300">
                Self-Healing Mesh Protocol:
              </div>
              <p className="text-[11px] text-slate-400">
                Each node maintains dynamic alternate parent routing tables. If an intermediate node (e.g., SN-05) fails, downstream nodes immediately route packets through SN-04 or SN-08 via RSSI-weighted AODV mesh logic, preserving 99.4% packet delivery without gateway disconnection.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
