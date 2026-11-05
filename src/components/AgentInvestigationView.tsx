/**
 * Agentic AI Investigation Console
 * Displays autonomous multi-step reasoning, tool execution DAG,
 * spatial neighborhood corroboration, and ranger containment action plans.
 */

import React, { useState } from 'react';
import { AgentInvestigation, SensorNode } from '../types';
import { Bot, ChevronDown, ChevronRight, CheckCircle2, AlertOctagon, Send, Plane, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

interface AgentInvestigationViewProps {
  investigation: AgentInvestigation | null;
  triggerNode: SensorNode | null;
  onRunInvestigation: () => void;
  isInvestigating: boolean;
  onDispatchDrone?: () => void;
  onApproveActionPlan?: () => void;
}

export const AgentInvestigationView: React.FC<AgentInvestigationViewProps> = ({
  investigation,
  triggerNode,
  onRunInvestigation,
  isInvestigating,
  onDispatchDrone,
  onApproveActionPlan,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!investigation) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-slate-400">
        <Bot className="w-10 h-10 mx-auto mb-2 text-slate-600" />
        <h3 className="text-base font-semibold text-slate-200">
          Agentic AI Reasoning Engine Standing By
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          The autonomous Sentinel agent continuously monitors telemetry streams. When a signal anomaly or CUSUM change-point triggers, it initiates multi-step reasoning, queries spatial neighbors, reconfigures node duty cycles, and synthesizes containment plans.
        </p>
        <button
          onClick={onRunInvestigation}
          disabled={isInvestigating}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{isInvestigating ? 'Analyzing Signals...' : 'Invoke Agent Investigation'}</span>
        </button>
      </div>
    );
  }

  const threatColor =
    investigation.threatLevel === 'CRITICAL_WILDFIRE'
      ? 'text-red-400 border-red-800 bg-red-950/60'
      : investigation.threatLevel === 'ADVISORY'
      ? 'text-amber-400 border-amber-800 bg-amber-950/60'
      : investigation.threatLevel === 'WATCH'
      ? 'text-yellow-400 border-yellow-800 bg-yellow-950/60'
      : 'text-emerald-400 border-emerald-800 bg-emerald-950/60';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Investigation Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-amber-400" />
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>Autonomous Wildfire Investigation</span>
              <span className="font-mono text-xs text-slate-400">
                {investigation.investigationId}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Trigger: {triggerNode?.name || investigation.triggerNodeId} · Verified with Gemini 3.8 Flash Agent Core
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono">Certainty Score</div>
            <div className="text-base font-bold font-mono text-white tabular-nums">
              {investigation.confidenceScore}%
            </div>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-bold font-mono rounded border uppercase ${threatColor}`}
          >
            {investigation.threatLevel.replace('_', ' ')}
          </span>

          <button
            onClick={onRunInvestigation}
            disabled={isInvestigating}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
            title="Re-run Agent Investigation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isInvestigating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Agent Hypothesis Banner */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent Diagnostic Hypothesis</span>
          </div>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">
            {investigation.hypothesis}
          </p>
        </div>

        {/* Multi-Step Agent Reasoning Trace */}
        <div>
          <div className="text-xs font-semibold text-slate-200 mb-2">
            Autonomous Reasoning Trace & Tool Execution
          </div>

          <div className="space-y-2">
            {investigation.reasoningSteps.map((step, idx) => {
              const isExpanded = expandedSteps[idx] !== false;
              return (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-md overflow-hidden text-xs"
                >
                  <button
                    onClick={() => toggleStep(idx)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/50 hover:bg-slate-900 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{step.step}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">
                        Conf: {step.confidence}%
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 py-2.5 space-y-2 border-t border-slate-800/60 bg-slate-950">
                      <p className="text-slate-300 text-xs leading-normal">{step.finding}</p>

                      {step.actionsTaken && step.actionsTaken.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-[10px] font-mono text-amber-400 uppercase">
                            Autonomous Tool Invocations:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {step.actionsTaken.map((action, aIdx) => (
                              <span
                                key={aIdx}
                                className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300"
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.detail && (
                        <p className="text-[11px] text-slate-400 italic">{step.detail}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tactical Incident Action Plan for Forest Rangers */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Ranger Incident Action Plan</span>
            </div>
            <span
              className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                investigation.actionPlan.priority === 'URGENT'
                  ? 'bg-red-950 text-red-300 border-red-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Priority: {investigation.actionPlan.priority}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Recommended Perimeter
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {investigation.actionPlan.recommendedPerimeterMeters} meters
              </span>
            </div>

            <div className="p-2 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Ranger Unit Deployment
              </span>
              <span className="font-semibold text-white text-xs">
                {investigation.actionPlan.rangerDispatchRecommended
                  ? 'Immediate Dispatch Recommended'
                  : 'Maintain Passive Sensor Watch'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-300">
            <strong className="text-slate-200">Containment Strategy:</strong>{' '}
            {investigation.actionPlan.containmentStrategy}
          </div>

          <div className="text-xs text-slate-400">
            <strong className="text-slate-300">Sensor Network Reconfiguration:</strong>{' '}
            {investigation.actionPlan.sensorNetworkAdjustment}
          </div>

          {/* Interactive Human-in-the-Loop Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2 flex-wrap">
            {investigation.actionPlan.rangerDispatchRecommended && (
              <button
                onClick={onApproveActionPlan}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Approve Ranger Dispatch</span>
              </button>
            )}

            <button
              onClick={onDispatchDrone}
              className="px-3 py-1.5 text-xs font-medium text-sky-200 bg-sky-950 border border-sky-800 hover:bg-sky-900 rounded transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>
                {investigation.droneReconActive
                  ? 'Re-task UAV Scan Radius'
                  : 'Dispatch Autonomous UAV'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
