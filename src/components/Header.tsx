/**
 * Top Navigation Bar adhering to the Top Bar Contract (§2):
 * Zone 1: Single text element wordmark (ForestFire Sentinel)
 * Zone 2: 5 concise single-line nav links with active state indicator
 * Zone 3: Simulation controls & mobile drawer toggle
 */

import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { Flame, Play, Pause, RotateCcw, Menu, X, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isRunning: boolean;
  onToggleSimulation: () => void;
  onTriggerFireScenario: () => void;
  onResetSimulation: () => void;
  activeAlarmCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  isRunning,
  onToggleSimulation,
  onTriggerFireScenario,
  onResetSimulation,
  activeAlarmCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between gap-6 px-4 md:px-6 py-3.5 max-w-[1520px] mx-auto">
        {/* Zone 1: Brand wordmark (single text element, no pills or descriptors) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#intelligence"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('intelligence');
            }}
            className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1"
          >
            ForestFire Sentinel
          </a>
        </div>

        {/* Zone 2: 5 concise single-line navigation links (Desktop) */}
        <nav
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300"
        >
          <a
            href="#intelligence"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('intelligence');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap pb-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1 ${
              activeTab === 'intelligence'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Wildfire Intelligence
          </a>

          <a
            href="#realworld"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('realworld');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap pb-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1 flex items-center gap-1.5 ${
              activeTab === 'realworld'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <span>Real-World Map</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-800">
              Google
            </span>
          </a>

          <a
            href="#optimizer"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('optimizer');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap pb-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1 ${
              activeTab === 'optimizer'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Sensor Network Optimizer
          </a>

          <a
            href="#prototype"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('prototype');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap pb-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1 flex items-center gap-1.5 ${
              activeTab === 'prototype'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <span>Hardware Prototype</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
              ESP32
            </span>
          </a>

          <a
            href="#research"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('research');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap pb-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1 ${
              activeTab === 'research'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Research & Evaluation
          </a>

          <a
            href="#incidents"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('incidents');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap pb-0.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded px-1 flex items-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <span>Tactical Incidents</span>
            {activeAlarmCount > 0 && (
              <span className="font-mono text-xs px-1.5 py-0.2 bg-red-950 text-red-400 border border-red-800 rounded">
                {activeAlarmCount}
              </span>
            )}
          </a>
        </nav>

        {/* Zone 3: Primary simulation controls & mobile hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleSimulation}
            className={`px-2.5 md:px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              isRunning
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:bg-emerald-900'
            }`}
            title={isRunning ? 'Pause simulation tick' : 'Resume simulation tick'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={onResetSimulation}
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-md transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            title="Reset simulation to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTriggerFireScenario}
            className="px-3 md:px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 rounded-md shadow-sm transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <Flame className="w-3.5 h-3.5 text-amber-200" />
            <span>Ignite Test Fire</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-md transition-colors cursor-pointer ml-1 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/98 border-b border-slate-800 px-4 py-3 space-y-2 text-sm font-medium">
          <a
            href="#intelligence"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('intelligence');
            }}
            className={`block px-3 py-2 rounded-md transition-colors ${
              activeTab === 'intelligence'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/80 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            Wildfire Intelligence
          </a>

          <a
            href="#realworld"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('realworld');
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
              activeTab === 'realworld'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/80 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <span>Real-World Map & Grounding</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
              Google
            </span>
          </a>

          <a
            href="#optimizer"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('optimizer');
            }}
            className={`block px-3 py-2 rounded-md transition-colors ${
              activeTab === 'optimizer'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/80 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            Sensor Network Optimizer
          </a>

          <a
            href="#prototype"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('prototype');
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
              activeTab === 'prototype'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/80 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <span>Hardware Prototype</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
              ESP32
            </span>
          </a>

          <a
            href="#research"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('research');
            }}
            className={`block px-3 py-2 rounded-md transition-colors ${
              activeTab === 'research'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/80 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            Research & Evaluation
          </a>

          <a
            href="#incidents"
            onClick={(e) => {
              e.preventDefault();
              handleTabClick('incidents');
            }}
            className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
              activeTab === 'incidents'
                ? 'bg-amber-950/50 text-amber-400 border border-amber-800/80 font-semibold'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <span>Tactical Incidents</span>
            {activeAlarmCount > 0 && (
              <span className="font-mono text-xs px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded">
                {activeAlarmCount} Active
              </span>
            )}
          </a>
        </div>
      )}
    </header>
  );
};
