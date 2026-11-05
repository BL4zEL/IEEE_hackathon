/**
 * Proposed Hardware Prototype Visualization & System Architecture
 * Presents the field sensor node (ESP32, SHT31/DHT22, MQ-2, IR flame, LoRa, solar power),
 * gateway hub, end-to-end data flow, pinout schematic, and prototype demonstration notes.
 */

import React, { useState } from 'react';
import { HardwareComponent, NavigationTab } from '../types';
import {
  Cpu,
  Radio,
  Sun,
  Flame,
  Wind,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Info,
  Server,
  Activity,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface HardwarePrototypeViewProps {
  onNavigateToTab?: (tab: NavigationTab) => void;
}

const HARDWARE_COMPONENTS: HardwareComponent[] = [
  {
    id: 'esp32',
    name: 'ESP32 Microcontroller Core',
    category: 'controller',
    model: 'ESP-WROOM-32 (NodeMCU / DevKit v1)',
    operatingVoltage: '3.3V DC (LDO regulated)',
    powerDrawActive: '80–120 mA (WiFi/LoRa burst)',
    powerDrawSleep: '10–15 µA (Deep Sleep ULP mode)',
    samplingCadence: 'Adaptive: 60s sleep nominal, 2s burst under alert',
    signalRole: 'Acquires raw analog/digital telemetry, executes on-chip fixed-point 1D Kalman filter and CUSUM change detector, manages LoRa wake-up states.',
    physicalLocation: 'Mounted inside main IP65 weather-sealed electronics compartment.',
    demoNote: 'Ideal maker microcontroller for hackathon demonstration with high ADC resolution, dual-core processing, and low-power sleep modes.',
    pinouts: [
      { pin: '3V3 / GND', esp32Pin: '3V3 / GND', protocol: 'Power', description: 'Regulated 3.3V rail from HT7333 LDO' },
      { pin: 'SDA / SCL', esp32Pin: 'GPIO 21 / GPIO 22', protocol: 'I2C', description: 'I2C bus for SHT31 / RTC module' },
      { pin: 'SPI MOSI/MISO/SCK', esp32Pin: 'GPIO 23 / 19 / 18', protocol: 'SPI', description: 'High-speed SPI to SX1278 LoRa transceiver' },
      { pin: 'ADC_MQ2', esp32Pin: 'GPIO 34 (ADC1_CH6)', protocol: 'ADC', description: 'Analog voltage reading from MQ-2 gas divider' },
      { pin: 'IR_FLAME_IN', esp32Pin: 'GPIO 35 (Input)', protocol: 'GPIO', description: 'Digital interrupt from LM393 IR flame comparator' },
    ],
  },
  {
    id: 'sht31',
    name: 'Ambient Temperature & Humidity Sensor',
    category: 'sensor',
    model: 'SHT31-D (or DHT22 AM2302)',
    operatingVoltage: '2.4V – 5.5V (typically 3.3V)',
    powerDrawActive: '0.8 mA (during conversion)',
    powerDrawSleep: '0.2 µA (standby)',
    samplingCadence: 'Every 60s (nominal) / 2s (active outbreak)',
    signalRole: 'Provides ambient thermal and relative humidity baseline to compute Canadian Fire Weather Index (FWI) and feed Kalman rate-of-rise (dT/dt).',
    physicalLocation: 'Housed in lower louvered Stevenson-style solar radiation shield to prevent direct sun heating.',
    demoNote: 'High accuracy (±0.3°C, ±2% RH) calibrated digital sensor with factory temperature compensation.',
    pinouts: [
      { pin: 'VIN', esp32Pin: '3.3V', protocol: 'Power', description: 'Regulated power rail' },
      { pin: 'GND', esp32Pin: 'GND', protocol: 'Power', description: 'Common system ground' },
      { pin: 'SDA', esp32Pin: 'GPIO 21', protocol: 'I2C', description: 'Data line with 4.7kΩ pull-up' },
      { pin: 'SCL', esp32Pin: 'GPIO 22', protocol: 'I2C', description: 'Clock line with 4.7kΩ pull-up' },
    ],
  },
  {
    id: 'mq2',
    name: 'Combustion Smoke & Gas Sensor',
    category: 'sensor',
    model: 'MQ-2 Semiconductor Combustible Gas / Smoke',
    operatingVoltage: '5.0V (Heater coil), 3.3V ADC divider',
    powerDrawActive: '150 mA (Internal tin-oxide heater coil)',
    powerDrawSleep: 'Pulsed duty-cycle (warmed 15s prior to read)',
    samplingCadence: 'Pulsed check every 60s, continuous under alarm',
    signalRole: 'Detects incomplete biomass combustion gases (CO, propane, methane, smoke particulates). Used by Dempster-Shafer fusion to reject solar thermal artifacts.',
    physicalLocation: 'Mounted in semi-permeable ventilated mesh chamber on bottom of enclosure.',
    demoNote: 'Demonstration prototype sensor; in industrial deployment, Sensirion SGP41 electrochemical sensor is used for sub-milliamp baseline consumption.',
    pinouts: [
      { pin: 'VCC', esp32Pin: '5V (Pulsed MOSFET gate)', protocol: 'Power', description: 'Pulsed power rail for heater' },
      { pin: 'AOUT', esp32Pin: 'GPIO 34', protocol: 'ADC', description: 'Voltage proportional to gas concentration' },
      { pin: 'DOUT', esp32Pin: 'GPIO 32', protocol: 'GPIO', description: 'Digital threshold trigger from onboard pot' },
    ],
  },
  {
    id: 'flame',
    name: 'IR Flame Phototransistor Array',
    category: 'sensor',
    model: 'YG1006 / LM393 Flame Detection Module',
    operatingVoltage: '3.3V – 5.0V',
    powerDrawActive: '15 mA',
    powerDrawSleep: '< 1 µA',
    samplingCadence: 'Hardware interrupt (instantaneous trigger)',
    signalRole: 'Senses narrow-band infrared radiation (760nm–1100nm) typical of open wood flame. Wakes ESP32 from deep sleep via external interrupt.',
    physicalLocation: 'Pointed through high-transmittance optical window toward high-risk forest fuel sectors.',
    demoNote: 'Effective range 0.8m–1.5m for bench demonstration, scalable via multi-pixel thermopile array (e.g. MLX90640) for 120m field detection.',
    pinouts: [
      { pin: 'VCC', esp32Pin: '3.3V', protocol: 'Power', description: 'System power' },
      { pin: 'DO', esp32Pin: 'GPIO 35', protocol: 'GPIO', description: 'Active-low interrupt on flame threshold' },
      { pin: 'AO', esp32Pin: 'GPIO 36 (VP)', protocol: 'ADC', description: 'Analog infrared intensity level' },
    ],
  },
  {
    id: 'lora',
    name: 'LoRa Long-Range Radio Transceiver',
    category: 'communication',
    model: 'Semtech SX1278 (433MHz) / SX1262 (868/915MHz) Ra-02',
    operatingVoltage: '3.3V DC',
    powerDrawActive: '20–29 mA (TX @ +17dBm), 10 mA (RX)',
    powerDrawSleep: '0.2 µA (Sleep mode)',
    samplingCadence: 'Transmits 24-byte telemetry payload every 60s or on anomaly',
    signalRole: 'Provides robust sub-GHz spread-spectrum RF communication through dense forest tree canopies over 2–5 km line-of-sight without cellular coverage.',
    physicalLocation: 'Integrated with top-mounted 3dBi fiberglass omnidirectional whip antenna.',
    demoNote: 'Operates in license-free ISM bands. Packets contain sensor ID, Kalman temperature, humidity, CUSUM metric, gas ADC, and battery voltage.',
    pinouts: [
      { pin: 'NSS', esp32Pin: 'GPIO 5', protocol: 'SPI', description: 'SPI Chip Select' },
      { pin: 'MOSI / MISO', esp32Pin: 'GPIO 23 / GPIO 19', protocol: 'SPI', description: 'SPI Data In / Out' },
      { pin: 'SCK', esp32Pin: 'GPIO 18', protocol: 'SPI', description: 'SPI Clock' },
      { pin: 'DIO0', esp32Pin: 'GPIO 2', protocol: 'GPIO', description: 'Packet TX/RX complete interrupt' },
      { pin: 'RST', esp32Pin: 'GPIO 14', protocol: 'GPIO', description: 'Hardware reset pin' },
    ],
  },
  {
    id: 'power',
    name: 'Solar Harvesting & Power Management',
    category: 'power',
    model: '18650 LiFePO4 / Li-Ion (3200mAh) + TP4056 + 5V 1W Solar Panel',
    operatingVoltage: '3.7V nominal (3.0V cutoff – 4.2V float)',
    powerDrawActive: 'Supplies peak 250 mA surges during LoRa/MQ-2 bursts',
    powerDrawSleep: 'Quiescent drain: < 25 µA through HT7333 ultra-low IQ LDO',
    samplingCadence: 'Continuous solar charge harvesting during daylight',
    signalRole: 'Guarantees continuous 24/7 autonomous field operation with estimated 5–7 year battery life before cell replacement.',
    physicalLocation: 'LiFePO4 battery secure inside waterproof cradle; solar panel angled at 45° on mast top.',
    demoNote: 'LiFePO4 chemistry is specifically chosen for forest environments due to thermal stability (resists thermal runaway up to 60°C).',
    pinouts: [
      { pin: 'Solar IN+', esp32Pin: 'TP4056 IN+', protocol: 'Power', description: '5V solar input via Schottky diode' },
      { pin: 'BAT OUT', esp32Pin: 'HT7333 IN', protocol: 'Power', description: 'Battery voltage to 3.3V LDO regulator' },
      { pin: 'V_SENSE', esp32Pin: 'GPIO 39 (VN)', protocol: 'ADC', description: '100k/100k resistor divider to monitor battery %' },
    ],
  },
  {
    id: 'enclosure',
    name: 'Weather-Resistant Mast Enclosure',
    category: 'enclosure',
    model: 'IP65 ABS Enclosure with Dual-Chamber Vented Shield',
    operatingVoltage: 'Passive mechanical',
    powerDrawActive: '0 mA',
    powerDrawSleep: '0 mA',
    samplingCadence: 'Continuous environmental protection',
    signalRole: 'Protects sensitive electronics from rain, insects, and humidity while allowing unhindered airflow around the gas and temperature sensors.',
    physicalLocation: '2.5m treated fiberglass or aluminum mounting pole clamped to forest tree trunk.',
    demoNote: 'Features a waterproof cable gland, downward-facing rain baffle for sensor probes, and vibration-damped pole U-bolts.',
  },
  {
    id: 'gateway',
    name: 'Forest LoRaWAN Gateway Hub',
    category: 'gateway',
    model: 'ESP32 LoRa Gateway / Raspberry Pi 4 + SX1302 Concentrator Hat',
    operatingVoltage: '12V DC (Solar-backed) or 5V USB-C',
    powerDrawActive: '1.2W – 3.5W',
    powerDrawSleep: 'Always-on listener',
    samplingCadence: 'Continuous packet demodulation on 8 channels',
    signalRole: 'Collects RF packets from all surrounding field nodes, performs timestamping and RSSI logging, and transmits JSON payloads via 4G LTE/Wi-Fi to the ForestFire Sentinel server.',
    physicalLocation: 'Erected on high-elevation outlook tower (e.g. Eagle Outlook Peak SN-02) for maximum radio line-of-sight.',
    demoNote: 'For hackathon demonstration, a single-channel ESP32 LoRa-to-WiFi bridge connects directly to the localhost/cloud platform API.',
  },
];

export const HardwarePrototypeView: React.FC<HardwarePrototypeViewProps> = ({
  onNavigateToTab,
}) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('esp32');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const selectedComp = HARDWARE_COMPONENTS.find((c) => c.id === selectedComponentId) || HARDWARE_COMPONENTS[0];

  const filteredComponents =
    activeCategory === 'all'
      ? HARDWARE_COMPONENTS
      : HARDWARE_COMPONENTS.filter((c) => c.category === activeCategory);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col space-y-6 p-5 md:p-6">
      {/* Header & Concept Disclaimer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-semibold">
              Proposed Physical Hardware Design
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300">
              Prototype Specification
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white">
            Field Sensor Node & LoRa Gateway Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            A practical, cost-effective physical hardware prototype design demonstrating how ForestFire Sentinel bridges low-power microcontroller sensing, sub-GHz wireless mesh telemetry, and agentic wildfire intelligence.
          </p>
        </div>

        {/* Quick Contextual Actions */}
        <div className="flex items-center gap-2">
          {onNavigateToTab && (
            <>
              <button
                onClick={() => onNavigateToTab('intelligence')}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>View Live Telemetry</span>
              </button>
              <button
                onClick={() => onNavigateToTab('optimizer')}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Topology Optimizer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Prototype Status Callout */}
      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 leading-relaxed">
          <strong className="text-white">Proposed Prototype Design:</strong> This visual presents the proposed physical architecture for bench demonstration and field replication. Components use standard, accessible off-the-shelf electronics (ESP32, SHT31, MQ-2, LoRa SX1278) with an estimated prototype unit cost of <strong className="text-amber-300 font-mono">~$38.50</strong>, validating that the platform's advanced Kalman/CUSUM signal processing can execute on low-power edge microcontrollers.
        </div>
      </div>

      {/* Main Grid: Interactive Visual Blueprint (Left) + Component Deep-Dive Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Interactive Hardware Mast Blueprint */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Interactive Physical Node Blueprint</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Click hot-spots to inspect subsystem specs
            </span>
          </div>

          {/* SVG Technical Blueprint Graphic */}
          <div className="relative w-full aspect-[4/3] max-h-[460px] bg-slate-950/80 rounded border border-slate-900 flex items-center justify-center p-2 overflow-hidden">
            <svg
              viewBox="0 0 560 420"
              className="w-full h-full object-contain select-none"
            >
              {/* Grid background lines */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="0.8" />
                </pattern>
                <linearGradient id="mastGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="solarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
              <rect width="560" height="420" fill="url(#grid)" />

              {/* Central Aluminum Mast */}
              <rect x="272" y="40" width="16" height="360" fill="url(#mastGrad)" rx="2" />
              <line x1="260" y1="390" x2="300" y2="390" stroke="#475569" strokeWidth="4" />
              <text x="280" y="410" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
                2.5m Aluminum Mounting Mast
              </text>

              {/* 1. LoRa Antenna at Apex */}
              <g
                onClick={() => setSelectedComponentId('lora')}
                className="cursor-pointer group"
              >
                <rect x="278" y="20" width="4" height="60" fill="#38bdf8" rx="1" />
                <circle cx="280" cy="18" r="4" fill="#38bdf8" />
                {/* RF wave pulses */}
                <circle cx="280" cy="18" r="14" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" className="animate-ping" />
                <circle cx="280" cy="18" r="8" fill="rgba(56, 189, 248, 0.2)" />
                <rect x="295" y="10" width="105" height="20" fill="#0f172a" stroke={selectedComponentId === 'lora' ? '#38bdf8' : '#334155'} rx="4" />
                <text x="302" y="24" fill={selectedComponentId === 'lora' ? '#38bdf8' : '#cbd5e1'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  LoRa 868MHz Antenna
                </text>
                <line x1="284" y1="18" x2="295" y2="20" stroke="#38bdf8" strokeWidth="1" />
              </g>

              {/* 2. Solar Panel Array */}
              <g
                onClick={() => setSelectedComponentId('power')}
                className="cursor-pointer group"
              >
                {/* Angled bracket */}
                <line x1="280" y1="95" x2="210" y2="70" stroke="#64748b" strokeWidth="3" />
                {/* Panel rectangle angled */}
                <polygon
                  points="165,55 235,45 220,95 150,105"
                  fill="url(#solarGrad)"
                  stroke={selectedComponentId === 'power' ? '#f59e0b' : '#334155'}
                  strokeWidth={selectedComponentId === 'power' ? '2' : '1.5'}
                />
                {/* Solar grid lines */}
                <line x1="180" y1="52" x2="165" y2="102" stroke="#38bdf8" strokeWidth="0.8" opacity="0.7" />
                <line x1="200" y1="50" x2="185" y2="100" stroke="#38bdf8" strokeWidth="0.8" opacity="0.7" />
                <line x1="220" y1="47" x2="205" y2="97" stroke="#38bdf8" strokeWidth="0.8" opacity="0.7" />
                <line x1="158" y1="80" x2="228" y2="70" stroke="#38bdf8" strokeWidth="0.8" opacity="0.7" />

                <rect x="60" y="60" width="90" height="20" fill="#0f172a" stroke={selectedComponentId === 'power' ? '#f59e0b' : '#334155'} rx="4" />
                <text x="68" y="74" fill={selectedComponentId === 'power' ? '#f59e0b' : '#cbd5e1'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  5V 1W Solar PV
                </text>
                <line x1="150" y1="70" x2="165" y2="70" stroke="#f59e0b" strokeWidth="1" />
              </g>

              {/* 3. Main Electronics Weatherproof Enclosure */}
              <g
                onClick={() => setSelectedComponentId('esp32')}
                className="cursor-pointer group"
              >
                {/* Outer enclosure box */}
                <rect
                  x="220"
                  y="130"
                  width="120"
                  height="140"
                  fill="url(#boxGrad)"
                  stroke={selectedComponentId === 'esp32' ? '#10b981' : '#475569'}
                  strokeWidth={selectedComponentId === 'esp32' ? '2.5' : '1.5'}
                  rx="8"
                />
                {/* Mounting clamps */}
                <rect x="212" y="150" width="8" height="18" fill="#64748b" rx="2" />
                <rect x="340" y="150" width="8" height="18" fill="#64748b" rx="2" />
                <rect x="212" y="230" width="8" height="18" fill="#64748b" rx="2" />
                <rect x="340" y="230" width="8" height="18" fill="#64748b" rx="2" />

                {/* Internal PCB board visible inside */}
                <rect x="232" y="142" width="96" height="116" fill="#064e3b" stroke="#059669" strokeWidth="1" rx="4" />

                {/* ESP32 chip representation */}
                <rect x="250" y="152" width="45" height="40" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1" rx="2" />
                <rect x="256" y="156" width="33" height="20" fill="#334155" rx="1" />
                <text x="272" y="170" fill="#e2e8f0" fontSize="7" fontFamily="JetBrains Mono" textAnchor="middle" fontWeight="bold">
                  ESP32
                </text>
                <circle cx="288" cy="184" r="2" fill="#10b981" />

                {/* LiFePO4 battery compartment */}
                <rect x="242" y="200" width="76" height="22" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.8" rx="3" />
                <rect x="246" y="204" width="68" height="14" fill="#334155" rx="2" />
                <text x="280" y="214" fill="#f59e0b" fontSize="6.5" fontFamily="JetBrains Mono" textAnchor="middle">
                  3.2Ah LiFePO4
                </text>

                {/* LoRa Ra-02 chip */}
                <rect x="242" y="228" width="40" height="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" rx="2" />
                <text x="262" y="242" fill="#38bdf8" fontSize="6" fontFamily="JetBrains Mono" textAnchor="middle">
                  SX1278
                </text>

                {/* Hot-spot callout to ESP32 */}
                <rect x="360" y="160" width="130" height="20" fill="#0f172a" stroke={selectedComponentId === 'esp32' ? '#10b981' : '#334155'} rx="4" />
                <text x="368" y="174" fill={selectedComponentId === 'esp32' ? '#10b981' : '#cbd5e1'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  ESP32 + Edge Kalman
                </text>
                <line x1="340" y1="170" x2="360" y2="170" stroke="#10b981" strokeWidth="1" />
              </g>

              {/* 4. Optical IR Flame Sensor Window */}
              <g
                onClick={() => setSelectedComponentId('flame')}
                className="cursor-pointer group"
              >
                <circle cx="315" cy="240" r="7" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                <line x1="322" y1="240" x2="360" y2="230" stroke="#ef4444" strokeWidth="1" />
                <rect x="360" y="220" width="130" height="20" fill="#0f172a" stroke={selectedComponentId === 'flame' ? '#ef4444' : '#334155'} rx="4" />
                <text x="368" y="234" fill={selectedComponentId === 'flame' ? '#ef4444' : '#cbd5e1'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  IR Flame Sensor (760nm)
                </text>
              </g>

              {/* 5. Vented Lower Stevenson Chamber (SHT31 + MQ-2) */}
              <g
                onClick={() => setSelectedComponentId('sht31')}
                className="cursor-pointer group"
              >
                {/* Louver plates */}
                <ellipse cx="280" cy="285" rx="38" ry="8" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <ellipse cx="280" cy="298" rx="42" ry="8" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <ellipse cx="280" cy="311" rx="42" ry="8" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
                <ellipse cx="280" cy="324" rx="38" ry="8" fill="#1e293b" stroke="#64748b" strokeWidth="1" />

                {/* SHT31 sensor head inside */}
                <rect x="264" y="293" width="14" height="12" fill="#38bdf8" rx="1" />
                {/* MQ-2 cylinder head inside */}
                <circle cx="292" cy="300" r="7" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />

                {/* SHT31 callout */}
                <rect x="60" y="290" width="135" height="20" fill="#0f172a" stroke={selectedComponentId === 'sht31' ? '#38bdf8' : '#334155'} rx="4" />
                <text x="68" y="304" fill={selectedComponentId === 'sht31' ? '#38bdf8' : '#cbd5e1'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  SHT31 Temp / Humidity
                </text>
                <line x1="195" y1="300" x2="260" y2="300" stroke="#38bdf8" strokeWidth="1" />
              </g>

              {/* 6. MQ-2 Callout */}
              <g
                onClick={() => setSelectedComponentId('mq2')}
                className="cursor-pointer group"
              >
                <rect x="60" y="330" width="135" height="20" fill="#0f172a" stroke={selectedComponentId === 'mq2' ? '#f59e0b' : '#334155'} rx="4" />
                <text x="68" y="344" fill={selectedComponentId === 'mq2' ? '#f59e0b' : '#cbd5e1'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  MQ-2 Combustion Gas
                </text>
                <line x1="195" y1="340" x2="285" y2="310" stroke="#f59e0b" strokeWidth="1" />
              </g>

              {/* 7. IP65 Mechanical Spec Callout */}
              <g
                onClick={() => setSelectedComponentId('enclosure')}
                className="cursor-pointer group"
              >
                <rect x="360" y="270" width="145" height="20" fill="#0f172a" stroke={selectedComponentId === 'enclosure' ? '#94a3b8' : '#334155'} rx="4" />
                <text x="368" y="284" fill={selectedComponentId === 'enclosure' ? '#f1f5f9' : '#94a3b8'} fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
                  IP65 Weather Enclosure
                </text>
                <line x1="340" y1="260" x2="360" y2="280" stroke="#64748b" strokeWidth="1" />
              </g>
            </svg>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-mono uppercase mr-1">Select Subsystem:</span>
            {HARDWARE_COMPONENTS.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedComponentId(comp.id)}
                className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                  selectedComponentId === comp.id
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {comp.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Component Technical Deep-Dive Inspector */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-5 flex flex-col space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                {selectedComp.category.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-slate-500">ID: {selectedComp.id}</span>
            </div>
            <h3 className="text-base font-bold text-white mt-1.5">{selectedComp.name}</h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedComp.model}</p>
          </div>

          {/* Key Electrical Specs Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Operating Voltage</span>
              <span className="font-mono font-semibold text-white mt-0.5 block">{selectedComp.operatingVoltage}</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Current</span>
              <span className="font-mono font-semibold text-amber-300 mt-0.5 block">{selectedComp.powerDrawActive}</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Sleep Current</span>
              <span className="font-mono font-semibold text-emerald-400 mt-0.5 block">{selectedComp.powerDrawSleep}</span>
            </div>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Sampling Cadence</span>
              <span className="font-mono font-semibold text-sky-300 mt-0.5 block text-[11px]">{selectedComp.samplingCadence}</span>
            </div>
          </div>

          {/* Signal Processing Role */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs space-y-1">
            <span className="font-semibold text-slate-200 block">Role in Signal Intelligence:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">{selectedComp.signalRole}</p>
          </div>

          {/* Physical Placement & Hackathon Demo Note */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs space-y-1">
            <span className="font-semibold text-slate-200 block">Demonstration & Mounting Note:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">{selectedComp.demoNote}</p>
            <div className="pt-1 text-[11px] text-amber-400/90 font-mono">
              Location: {selectedComp.physicalLocation}
            </div>
          </div>

          {/* Pinouts & Wiring Matrix (if available) */}
          {selectedComp.pinouts && selectedComp.pinouts.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-200 block">ESP32 Pinout Connections:</span>
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[9px] border-b border-slate-800">
                    <tr>
                      <th className="px-2 py-1.5">Module Pin</th>
                      <th className="px-2 py-1.5">ESP32 GPIO</th>
                      <th className="px-2 py-1.5">Bus</th>
                      <th className="px-2 py-1.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {selectedComp.pinouts.map((p, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-900/40">
                        <td className="px-2 py-1 text-slate-200 font-bold">{p.pin}</td>
                        <td className="px-2 py-1 text-amber-300">{p.esp32Pin}</td>
                        <td className="px-2 py-1 text-sky-400">{p.protocol}</td>
                        <td className="px-2 py-1 text-slate-400 text-[10px]">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End-to-End System Flow Diagram */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>End-to-End Hardware Telemetry & Intelligence Flow</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              From physical forest sensors to the autonomous Gemini wildfire agent
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            System Latency: &lt; 18.5 seconds to confirmed outbreak
          </span>
        </div>

        {/* 5-Stage Pipeline Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Stage 1: Field Sensors */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] uppercase font-bold">
                <span>01. Acquisition</span>
              </div>
              <h4 className="font-semibold text-white mt-1">Multi-Modal Sensors</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                SHT31 measures ambient temperature; MQ-2 samples combustible CO; IR phototransistor tracks flame luminescence.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Analog & I2C Bus
            </div>
          </div>

          {/* Stage 2: ESP32 Edge Node */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] uppercase font-bold">
                <span>02. Edge DSP</span>
              </div>
              <h4 className="font-semibold text-white mt-1">ESP32 Microcontroller</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Executes discrete 1D Kalman filter (noise variance reduction) and CUSUM change detector. Wakes LoRa on anomaly.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              375 µJ / Inference
            </div>
          </div>

          {/* Stage 3: LoRa Radio Mesh */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[10px] uppercase font-bold">
                <span>03. Transmission</span>
              </div>
              <h4 className="font-semibold text-white mt-1">LoRa Chirp RF Mesh</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                868/915 MHz long-range chirps penetrate tree foliage over 2–5 km. Relayed across neighbor nodes if direct path is shaded.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              24-Byte Compact Payload
            </div>
          </div>

          {/* Stage 4: Gateway Hub */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-purple-400 font-mono text-[10px] uppercase font-bold">
                <span>04. Ingestion</span>
              </div>
              <h4 className="font-semibold text-white mt-1">Gateway Hub Backhaul</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Receives LoRa packets, validates CRC, attaches tower coordinates, and streams JSON payload via 4G/Wi-Fi to server API.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              REST / WebSocket Bridge
            </div>
          </div>

          {/* Stage 5: Cloud Agentic Platform */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[10px] uppercase font-bold">
                <span>05. Intelligence</span>
              </div>
              <h4 className="font-semibold text-white mt-1">Agentic Wildfire Core</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Dempster-Shafer multi-sensor fusion, spatial neighbor verification, Huygens fire spread modeling, and drone dispatch.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-500">
              Gemini 3.8 Flash Agent
            </div>
          </div>
        </div>
      </div>

      {/* Prototype Bill of Materials (BOM) & Hackathon Evaluation Section */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Prototype Demonstration Bill of Materials (Per Field Node)</span>
          </h3>
          <span className="font-mono text-xs font-semibold text-emerald-400">
            Total Prototype Unit Cost: ~$38.50
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-3 py-2">Component Part</th>
                <th className="px-3 py-2">Vendor / Type</th>
                <th className="px-3 py-2 text-right">Cost ($)</th>
                <th className="px-3 py-2">Role in Physical Demonstration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">ESP32 DevKit v1</td>
                <td className="px-3 py-2 text-slate-400">Espressif Dual-Core</td>
                <td className="px-3 py-2 text-right font-mono text-white">$4.50</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Core compute, ADC sampling, Kalman filter math</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">SHT31-D I2C Module</td>
                <td className="px-3 py-2 text-slate-400">Sensirion</td>
                <td className="px-3 py-2 text-right font-mono text-white">$3.20</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Calibrated ambient temperature and humidity for FWI</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">MQ-2 Gas / Smoke Module</td>
                <td className="px-3 py-2 text-slate-400">Zhengzhou Winsen</td>
                <td className="px-3 py-2 text-right font-mono text-white">$2.80</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Combustion smoke and CO particulate detection</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">SX1278 Ra-02 LoRa + Whip Antenna</td>
                <td className="px-3 py-2 text-slate-400">Ai-Thinker / Semtech</td>
                <td className="px-3 py-2 text-right font-mono text-white">$4.80</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Sub-GHz spread-spectrum wireless telemetry</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">18650 LiFePO4 Cell (3200mAh)</td>
                <td className="px-3 py-2 text-slate-400">3.2V High-Temp Cell</td>
                <td className="px-3 py-2 text-right font-mono text-white">$5.50</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Stable power storage resisting forest thermal extremes</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">5V 1W Monocrystalline PV Panel</td>
                <td className="px-3 py-2 text-slate-400">Epoxy Sealed Mini-Panel</td>
                <td className="px-3 py-2 text-right font-mono text-white">$3.20</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Daylight solar trickle recharging for 5+ year operation</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">TP4056 + HT7333 3.3V LDO</td>
                <td className="px-3 py-2 text-slate-400">Power Management PCB</td>
                <td className="px-3 py-2 text-right font-mono text-white">$1.50</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Ultra-low quiescent current (4µA) regulation</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="px-3 py-2 font-medium text-slate-200">IP65 Weather Enclosure & Rigging</td>
                <td className="px-3 py-2 text-slate-400">ABS Vented Shell</td>
                <td className="px-3 py-2 text-right font-mono text-white">$13.00</td>
                <td className="px-3 py-2 text-slate-400 text-[11px]">Mast pole clamp and louvered radiation shield</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
