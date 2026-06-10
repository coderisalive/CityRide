import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom Leaflet Icons using RemixIcon and HTML/CSS
const userIcon = L.divIcon({
    html: `<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);"></div>`,
    className: 'user-pin-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const driverIcon = L.divIcon({
    html: `<div style="background-color: #000000; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #fbbf24; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(0,0,0,0.4);">
             <i class="ri-car-fill" style="color: #fbbf24; font-size: 14px;"></i>
           </div>`,
    className: 'driver-pin-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const destinationIcon = L.divIcon({
    html: `<div style="color: #dc2626; font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; margin-top: -12px;">
             <i class="ri-map-pin-2-fill"></i>
           </div>`,
    className: 'destination-pin-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 24]
});

// Component to dynamically recenter/bounds fit the map
const MapController = ({ userLoc, driverLoc, destLoc, route }) => {
    const map = useMap();

    useEffect(() => {
        if (route && route.length > 0) {
            map.fitBounds(route, { padding: [50, 50] });
        } else {
            const points = [];
            if (userLoc) points.push([userLoc.lat || userLoc.ltd, userLoc.lng]);
            if (driverLoc) points.push([driverLoc.lat || driverLoc.ltd, driverLoc.lng]);
            if (destLoc) points.push([destLoc.lat || destLoc.ltd, destLoc.lng]);

            if (points.length > 1) {
                map.fitBounds(points, { padding: [50, 50], maxZoom: 16 });
            } else if (points.length === 1) {
                map.setView(points[0], 15);
            }
        }
    }, [userLoc, driverLoc, destLoc, route, map]);

    return null;
};

const LiveTracking = ({ driverLocation, destinationLocation, route }) => {
    const [ currentPosition, setCurrentPosition ] = useState({ lat: 20.5937, lng: 78.9629 });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentPosition({
                    lat: latitude,
                    lng: longitude
                });
            },
            (error) => {
                console.warn("User geolocation failed, using Patna fallback:", error);
                setCurrentPosition({
                    lat: 25.6003,
                    lng: 85.1872
                });
            }
        );

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentPosition({
                    lat: latitude,
                    lng: longitude
                });
            },
            (error) => {
                console.warn("User geolocation watch failed, using Patna fallback:", error);
                setCurrentPosition({
                    lat: 25.6003,
                    lng: 85.1872
                });
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Normalize coordinates format
    const getCoords = (loc) => {
        if (!loc) return null;
        return {
            lat: loc.lat || loc.ltd,
            lng: loc.lng
        };
    };

    const userLoc = currentPosition;
    const driverLoc = getCoords(driverLocation);
    const destLoc = getCoords(destinationLocation);

    const mapCenter = driverLoc || userLoc;

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <MapContainer
                center={[mapCenter.lat, mapCenter.lng]}
                zoom={15}
                style={{ width: '100%', height: '100%', zIndex: 1 }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {userLoc && (
                    <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon} />
                )}

                {driverLoc && (
                    <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon} />
                )}

                {destLoc && (
                    <Marker position={[destLoc.lat, destLoc.lng]} icon={destinationIcon} />
                )}

                {route && route.length > 0 && (
                    <Polyline positions={route} color="#2563eb" weight={5} opacity={0.8} />
                )}

                <MapController userLoc={userLoc} driverLoc={driverLoc} destLoc={destLoc} route={route} />
            </MapContainer>
        </div>
    );
};

export default LiveTracking;