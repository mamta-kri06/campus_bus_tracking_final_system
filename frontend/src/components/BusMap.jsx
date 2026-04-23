import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import { useLocationContext } from "../context/LocationContext";
import { getRouteColor } from "../utils/colors";
import { useInterpolatedLocation } from "../hooks/useInterpolatedLocation";
import RoutingMachine from "./RoutingMachine";

import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const movingBusIcon = L.divIcon({
  className: "bus-marker-moving",
  html: `
    <div class="bus-icon-container">
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 17V11C19 9.9 18.1 9 17 9H7C5.9 9 5 9.9 5 11V17M19 17H5M19 17V18C19 18.6 18.6 19 18 19H17C16.4 19 16 18.6 16 18V17M5 17V18C5 18.6 5.4 19 6 19H7C7.6 19 8 18.6 8 18V17" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 11V13H17V11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 19V21H15V19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div class="bus-ping"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function InterpolatedMarker({ bus, isSelected }) {
  const pos = useInterpolatedLocation(
    Number(bus.currentLocation?.latitude),
    Number(bus.currentLocation?.longitude)
  );

  return (
    <Marker position={pos} icon={movingBusIcon}>
      <Popup className="bus-popup">
        <div className="p-1">
          <h4 className="font-bold text-slate-900">Bus {bus.number}</h4>
          <p className="text-xs text-slate-500">{bus.route?.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${bus.status === 'running' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-xs font-semibold capitalize">{bus.status}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-indigo-600">ETA: {bus.etaMinutes || "--"} min</p>
        </div>
      </Popup>
    </Marker>
  );
}

function RecenterOnLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function BusMap({ buses, selectedBusId, onBusSelect }) {
  const { location } = useLocationContext();
  const fallbackCenter = [23.811881649928363, 86.4442943404539];
  const [mapCenter, setMapCenter] = useState(fallbackCenter);

  useEffect(() => {
    if (!location) return;
    // Only recenter if no bus is selected (follow user)
    if (!selectedBusId) {
      setMapCenter([location.latitude, location.longitude]);
    }
  }, [location, selectedBusId]);

  useEffect(() => {
    if (selectedBusId) {
      const selectedBus = buses.find(b => b._id === selectedBusId);
      if (selectedBus?.currentLocation) {
        setMapCenter([selectedBus.currentLocation.latitude, selectedBus.currentLocation.longitude]);
      }
    }
  }, [selectedBusId, buses]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={15}
      zoomControl={false}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterOnLocation center={mapCenter} />
      
      {/* Route Road-Paths */}
      {buses.map((bus) => {
        if (!bus.route?.stops?.length || bus.route.stops.length < 2) return null;
        const isSelected = bus._id === selectedBusId;
        const color = getRouteColor(bus.route._id);
        const path = bus.route.stops.map((s) => [s.latitude, s.longitude]);

        return (
          <RoutingMachine
            key={`route-${bus._id}`}
            waypoints={path}
            color={color}
            isSelected={isSelected}
          />
        );
      })}

      {/* Bus Markers */}
      {buses.map((bus) => (
        <InterpolatedMarker 
          key={bus._id} 
          bus={bus} 
          isSelected={bus._id === selectedBusId} 
        />
      ))}
    </MapContainer>
  );
}
