let map;
let marker;
let routeLine;
// Using OSRM demo server for routing - more reliable and no token needed
const ROUTING_API = 'https://router.project-osrm.org/route/v1/driving/';

// Initialize map
function initMap() {
    map = L.map('map').setView([40.7128, -74.0060], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([40.7128, -74.0060], { draggable: true }).addTo(map);
    
    // Click handlers for map
    map.on('click', function(e) {
        if (!marker) {
            marker = L.marker(e.latlng, { draggable: true }).addTo(map);
        } else {
            marker.setLatLng(e.latlng);
        }
        updateCoordinates(e.latlng);
    });
}

function updateCoordinates(latlng) {
    document.getElementById('startLat').value = latlng.lat.toFixed(6);
    document.getElementById('startLon').value = latlng.lng.toFixed(6);
}

async function getRoutePoints(startLat, startLon, endLat, endLon) {
    // Format coordinates for OSRM (longitude,latitude)
    const url = `${ROUTING_API}${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=polyline`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            // Decode the polyline to get array of coordinates
            const points = polyline.decode(data.routes[0].geometry);
            return points;
        } else {
            console.error('No route found:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching route:', error);
        return null;
    }
}

async function drawRoute() {
    const startLat = parseFloat(document.getElementById('startLat').value);
    const startLon = parseFloat(document.getElementById('startLon').value);
    const endLat = parseFloat(document.getElementById('endLat').value);
    const endLon = parseFloat(document.getElementById('endLon').value);

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    const routePoints = await getRoutePoints(startLat, startLon, endLat, endLon);
    
    if (routePoints) {
        routeLine = L.polyline(routePoints, { color: 'blue' }).addTo(map);
        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
        return routePoints;
    } else {
        alert('Could not find a route between these points. Make sure both points are on accessible roads.');
        return null;
    }
}

window.startSimulation = async function() {
    const startLat = parseFloat(document.getElementById('startLat').value);
    const startLon = parseFloat(document.getElementById('startLon').value);
    const endLat = parseFloat(document.getElementById('endLat').value);
    const endLon = parseFloat(document.getElementById('endLon').value);
    const speed = parseFloat(document.getElementById('speed').value);

    const routePoints = await drawRoute();
    
    if (!routePoints) {
        return;
    }

    // Create the simulation configuration
    const config = {
        route: routePoints,
        speed: speed
    };

    // Check if running in AutoTouch environment
    if (typeof webkit !== 'undefined' && webkit.messageHandlers && webkit.messageHandlers.autoTouch) {
        // Send to AutoTouch script
        webkit.messageHandlers.autoTouch.postMessage({
            action: 'startSimulation',
            config: config
        });
    } else {
        console.log('Not running in AutoTouch environment. Configuration:', config);
        alert('Please run this in AutoTouch on iOS to simulate GPS movement.');
    }
};

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', initMap);