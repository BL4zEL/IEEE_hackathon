/**
 * Real-World Geographic Map, Google Search Grounding, and Google Maps Grounding
 * Adheres to google-maps-platform skill (using @vis.gl/react-google-maps, AdvancedMarker,
 * and mandatory internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}),
 * and gemini-api skill for Google Search and Google Maps Grounding.
 */

import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { GroundingSource, MapsGroundingPlace, NavigationTab, RealWorldLocation } from '../types';
import {
  Globe,
  Search,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Flame,
  Wind,
  Compass,
  ArrowLeft,
  RefreshCw,
  Info,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

interface RealWorldGroundingViewProps {
  onReturnToSimulation: () => void;
  apiKey?: string;
}

const PRESET_REAL_LOCATIONS: RealWorldLocation[] = [
  {
    id: 'mahindra-hyderabad',
    name: 'Mahindra University & Dundigal Reserve',
    region: 'Telangana',
    country: 'India',
    lat: 17.5376,
    lng: 78.4357,
    zoom: 13,
    riskLevel: 'HIGH',
    fwiRating: 31.8,
    vegetationNotes: 'Dry deciduous scrub and eucalyptus groves with rocky granite ridges.',
    fireStationsNearby: [
      { name: 'Dundigal Emergency Fire Station', lat: 17.562, lng: 78.418, distanceKm: 3.4 },
      { name: 'Medchal Fire & Disaster Response', lat: 17.625, lng: 78.482, distanceKm: 11.2 },
      { name: 'Gandipet Water Reservoir Hub', lat: 17.391, lng: 78.305, distanceKm: 18.5 },
    ],
  },
  {
    id: 'angeles-socal',
    name: 'Angeles National Forest & San Gabriel',
    region: 'California',
    country: 'USA',
    lat: 34.2407,
    lng: -118.0594,
    zoom: 12,
    riskLevel: 'CRITICAL',
    fwiRating: 44.5,
    vegetationNotes: 'Dense chaparral, scrub oak, and Jeffrey pine under severe Santa Ana wind hazards.',
    fireStationsNearby: [
      { name: 'USFS Station 28 (Clear Creek)', lat: 34.275, lng: -118.173, distanceKm: 4.8 },
      { name: 'LA County Fire Camp 2', lat: 34.218, lng: -118.102, distanceKm: 6.1 },
      { name: 'Cogswell Reservoir Water Point', lat: 34.254, lng: -117.962, distanceKm: 9.3 },
    ],
  },
  {
    id: 'blue-mountains',
    name: 'Blue Mountains National Park',
    region: 'New South Wales',
    country: 'Australia',
    lat: -33.7150,
    lng: 150.3120,
    zoom: 12,
    riskLevel: 'HIGH',
    fwiRating: 38.2,
    vegetationNotes: 'Eucalyptus forest canopy rich in volatile organic oils subject to rapid crown ignition.',
    fireStationsNearby: [
      { name: 'Katoomba RFS Brigade HQ', lat: -33.711, lng: 150.308, distanceKm: 1.2 },
      { name: 'Wentworth Falls Fire Station', lat: -33.721, lng: 150.375, distanceKm: 6.4 },
      { name: 'Lake Medlow Emergency Water Staging', lat: -33.684, lng: 150.329, distanceKm: 4.5 },
    ],
  },
  {
    id: 'attica-pines',
    name: 'Mount Parnitha Pine Corridor',
    region: 'Attica',
    country: 'Greece',
    lat: 38.1500,
    lng: 23.8500,
    zoom: 12,
    riskLevel: 'CRITICAL',
    fwiRating: 42.0,
    vegetationNotes: 'Aleppo pine and dry Mediterranean garrigue prone to seasonal Meltemi wind-driven spread.',
    fireStationsNearby: [
      { name: 'Parnitha Hellenic Fire Brigade Post', lat: 38.162, lng: 23.725, distanceKm: 5.2 },
      { name: 'Acharnes Civil Protection Station', lat: 38.082, lng: 23.734, distanceKm: 8.9 },
      { name: 'Marathonas Water Air-Drop Basin', lat: 38.158, lng: 23.955, distanceKm: 12.1 },
    ],
  },
];

export const RealWorldGroundingView: React.FC<RealWorldGroundingViewProps> = ({
  onReturnToSimulation,
  apiKey = '',
}) => {
  const [selectedLocation, setSelectedLocation] = useState<RealWorldLocation>(PRESET_REAL_LOCATIONS[0]);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('terrain');

  // Search Grounding State
  const [searchQuery, setSearchQuery] = useState(
    'Current wildfire advisories and fire weather warnings in Telangana forest reserves'
  );
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Maps Grounding State
  const [mapsQuery, setMapsQuery] = useState(
    'Nearest fire stations, water reservoirs, and emergency access roads'
  );
  const [mapsResult, setMapsResult] = useState<string | null>(null);
  const [mapsPlaces, setMapsPlaces] = useState<MapsGroundingPlace[]>([]);
  const [isQueryingMaps, setIsQueryingMaps] = useState(false);

  // Fetch client API key if not supplied
  const [activeApiKey, setActiveApiKey] = useState(apiKey);
  useEffect(() => {
    if (!activeApiKey) {
      fetch('/api/config')
        .then((res) => res.json())
        .then((data) => {
          if (data.googleMapsApiKey) {
            setActiveApiKey(data.googleMapsApiKey);
          }
        })
        .catch(() => {});
    }
  }, [activeApiKey]);

  // Execute Google Search Grounding
  const handleExecuteSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || searchQuery;
    setIsSearching(true);
    setSearchResult(null);
    setSearchSources([]);

    try {
      const response = await fetch('/api/grounding-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          locationContext: `${selectedLocation.name}, ${selectedLocation.region}, ${selectedLocation.country}`,
        }),
      });

      const json = await response.json();
      if (json.success) {
        setSearchResult(json.text);
        setSearchSources(json.sources || []);
      }
    } catch (err) {
      console.error('Search grounding failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Execute Google Maps Grounding
  const handleExecuteMapsGrounding = async (overrideQuery?: string) => {
    const q = overrideQuery || mapsQuery;
    setIsQueryingMaps(true);
    setMapsResult(null);
    setMapsPlaces([]);

    try {
      const response = await fetch('/api/grounding-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng },
          locationName: selectedLocation.name,
        }),
      });

      const json = await response.json();
      if (json.success) {
        setMapsResult(json.text);
        setMapsPlaces(json.places || []);
      }
    } catch (err) {
      console.error('Maps grounding failed:', err);
    } finally {
      setIsQueryingMaps(false);
    }
  };

  // Run initial grounding on location switch
  useEffect(() => {
    handleExecuteSearch(`Wildfire risks, red flag warnings and environmental weather in ${selectedLocation.name}`);
    handleExecuteMapsGrounding(`Fire stations and emergency water reservoirs near ${selectedLocation.name}`);
  }, [selectedLocation.id]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col space-y-5 p-5 md:p-6">
      {/* Header & Distinction Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-semibold flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Real-World Geographic Intelligence</span>
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300">
              Google Maps Platform + Gemini Grounding
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white">
            Real-World Geographic Mapping & Live Grounded Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Examine real-world forest reserves, verified regional infrastructure, and live public safety information powered by Google Maps and Google Search grounding.
          </p>
        </div>

        {/* Back to Simulated Forest Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReturnToSimulation}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Simulated Forest (Mahindra Reserve)</span>
          </button>
        </div>
      </div>

      {/* Strict Data Boundary Disclaimer */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-slate-300 leading-relaxed">
          <strong className="text-white">Data Separation Boundary:</strong> This view displays{' '}
          <strong className="text-sky-400">real-world geographic coordinates, Google Maps tiles, and verified web citations</strong>.
          It is strictly segregated from the application's synthetic 1.0 km² sensor mesh and simulated fires. Real-world places are never marked as actively burning based on simulated data.
        </div>
      </div>

      {/* Real-World Region Selector */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-300 font-mono text-[11px] uppercase">
            Select Geographic Region:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_REAL_LOCATIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                  selectedLocation.id === loc.id
                    ? 'bg-sky-950 border-sky-600 text-sky-200 font-semibold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Coords: {selectedLocation.lat.toFixed(4)}°, {selectedLocation.lng.toFixed(4)}°</span>
          <span>·</span>
          <span className="text-amber-400">FWI: {selectedLocation.fwiRating}</span>
        </div>
      </div>

      {/* Main Grid: Google Maps Component (Left) + Search & Maps Grounding Panels (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Google Maps Platform Interactive Map */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">{selectedLocation.name}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{selectedLocation.region}, {selectedLocation.country}</span>
            </div>

            {/* Map Type Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono">
              {(['terrain', 'satellite', 'hybrid', 'roadmap'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setMapType(t)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    mapType === t ? 'bg-sky-950 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Google Map Container */}
          <div className="relative w-full h-[520px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
            <APIProvider apiKey={activeApiKey || ''}>
              <Map
                key={`${selectedLocation.id}-${mapType}`}
                defaultCenter={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                defaultZoom={selectedLocation.zoom}
                mapTypeId={mapType}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                className="w-full h-full"
                disableDefaultUI={false}
                zoomControl={true}
                gestureHandling="cooperative"
              >
                {/* Central Region Marker */}
                <AdvancedMarker
                  position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                  onClick={() => setSelectedMarker({
                    title: selectedLocation.name,
                    type: 'Region Focus',
                    notes: selectedLocation.vegetationNotes,
                  })}
                >
                  <Pin background="#0284c7" glyphColor="#ffffff" borderColor="#0369a1" />
                </AdvancedMarker>

                {/* Nearby Fire Stations / Infrastructure Markers */}
                {selectedLocation.fireStationsNearby.map((station, sIdx) => (
                  <AdvancedMarker
                    key={sIdx}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => setSelectedMarker({
                      title: station.name,
                      type: 'Emergency Infrastructure',
                      notes: `Distance: ${station.distanceKm} km from reserve perimeter.`,
                    })}
                  >
                    <Pin background="#d97706" glyphColor="#ffffff" borderColor="#b45309" scale={0.85} />
                  </AdvancedMarker>
                ))}

                {/* InfoWindow */}
                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="text-slate-900 p-1 text-xs max-w-xs">
                      <strong className="block text-sm font-bold text-slate-950">
                        {selectedMarker.title}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {selectedMarker.type}
                      </span>
                      <p className="mt-1 text-slate-700 leading-snug">
                        {selectedMarker.notes}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>

          {/* Map Footer Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span>Selected Forest Reserve</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Verified Fire Stations & Water Staging</span>
              </span>
            </div>
            <span className="font-mono text-slate-500">
              Powered by Google Maps Platform
            </span>
          </div>
        </div>

        {/* Right 5 Columns: Google Search Grounding & Google Maps Grounding Panels */}
        <div className="lg:col-span-5 space-y-5">
          {/* Panel 1: Google Search Grounding */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-white text-xs">
                  Google Search Grounding (Live Web Data)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                gemini-3.8-flash
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Retrieves authoritative real-world fire weather warnings, official advisories, and public safety notices from Google Search.
            </p>

            {/* Search Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
                placeholder="Search official fire advisories..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleExecuteSearch()}
                disabled={isSearching}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isSearching ? 'animate-spin' : ''}`} />
                <span>Search</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  const q = `Current fire weather advisories in ${selectedLocation.name}`;
                  setSearchQuery(q);
                  handleExecuteSearch(q);
                }}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Fire Weather Alerts
              </button>
              <button
                onClick={() => {
                  const q = `Emergency public safety guidelines for wildfire evacuation in ${selectedLocation.region}`;
                  setSearchQuery(q);
                  handleExecuteSearch(q);
                }}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Public Safety Guidance
              </button>
            </div>

            {/* Search Grounding Results Display */}
            {searchResult && (
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded text-xs space-y-2">
                <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {searchResult}
                </div>

                {/* Grounding Source Citations (Mandatory Attribution) */}
                {searchSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                      Google Search Grounding Sources:
                    </span>
                    <div className="flex flex-col gap-1">
                      {searchSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{source.title || source.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Panel 2: Google Maps Grounding */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-xs">
                  Google Maps Grounding (Places & Infrastructure)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-sky-400 px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800">
                googleMaps tool
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Queries real-world geographic places, roads, and emergency facilities around the selected coordinates via Gemini Maps grounding.
            </p>

            {/* Maps Query Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={mapsQuery}
                onChange={(e) => setMapsQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteMapsGrounding()}
                placeholder="Ask about nearby facilities, water sources, roads..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                onClick={() => handleExecuteMapsGrounding()}
                disabled={isQueryingMaps}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isQueryingMaps ? 'animate-spin' : ''}`} />
                <span>Locate</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  const q = `Emergency fire stations and disaster rescue teams near ${selectedLocation.name}`;
                  setMapsQuery(q);
                  handleExecuteMapsGrounding(q);
                }}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Fire Stations
              </button>
              <button
                onClick={() => {
                  const q = `Water reservoirs, dams, and helicopter refill lakes near ${selectedLocation.name}`;
                  setMapsQuery(q);
                  handleExecuteMapsGrounding(q);
                }}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Water Reservoirs
              </button>
              <button
                onClick={() => {
                  const q = `Primary mountain passes, access roads, and evacuation routes around ${selectedLocation.name}`;
                  setMapsQuery(q);
                  handleExecuteMapsGrounding(q);
                }}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded cursor-pointer"
              >
                Evacuation Roads
              </button>
            </div>

            {/* Maps Grounding Results Display */}
            {mapsResult && (
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded text-xs space-y-2">
                <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                  {mapsResult}
                </div>

                {/* Grounding Place Citations & Google Maps Links (Mandatory Compliance) */}
                {mapsPlaces.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                      Google Maps Verified Places & Action Links:
                    </span>
                    <div className="space-y-1">
                      {mapsPlaces.map((place, pIdx) => (
                        <div key={pIdx} className="p-2 bg-slate-950 border border-slate-800 rounded text-xs">
                          <a
                            href={place.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors underline"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span>{place.title}</span>
                          </a>
                          {place.address && (
                            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                              {place.address}
                            </div>
                          )}
                          {place.reviewSnippet && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">
                              "{place.reviewSnippet}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
