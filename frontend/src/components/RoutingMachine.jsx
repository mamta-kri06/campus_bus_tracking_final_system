import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import { useMap } from "react-leaflet";

export default function RoutingMachine({ waypoints, color, isSelected }) {
  const map = useMap();
  const routingControlRef = useRef(null);
  const waypointsKey = JSON.stringify(waypoints);

  useEffect(() => {
    if (!map || !waypoints || waypoints.length < 2) return;

    // Create the control
    const routingControl = L.Routing.control({
      waypoints: waypoints.map((wp) => L.latLng(wp[0], wp[1])),
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      lineOptions: {
        styles: [
          { color: "white", weight: 10, opacity: 0.9 }, // Large white shadow
          { color: color, weight: 6, opacity: 1.0 }, // Thick main line
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 2000,
      },
      altLineOptions: {
        styles: [{ color: "black", weight: 2, opacity: 0.5, dashArray: "5, 10" }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: false,
      show: false,
      containerClassName: 'hidden',
      createMarker: () => null,
    });

    routingControlRef.current = routingControl;
    
    try {
      routingControl.addTo(map);
    } catch (e) {
      console.warn("Failed to add routing control:", e);
    }

    return () => {
      if (routingControlRef.current && map) {
        try {
          // Leaflet Routing Machine has a known bug where it might try to remove layers 
          // that are already gone during cleanup. We wrap it to prevent crashes.
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.debug("Safe cleanup of routing control:", e);
        }
        routingControlRef.current = null;
      }
    };
  }, [map, waypointsKey, color, isSelected]);

  return null;
}
