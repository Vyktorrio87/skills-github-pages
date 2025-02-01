// AutoTouch iOS GPS Driving Simulation
// This script simulates realistic driving patterns

function sleep(ms) {
    usleep(ms * 1000);
}

// Simulates realistic speed variations
function getRandomSpeed(baseSpeed) {
    // Vary speed slightly to seem more natural
    return baseSpeed + (Math.random() * 5 - 2.5);
}

// Calculate distance between two points in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
             Math.cos(φ1) * Math.cos(φ2) *
             Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function simulateDriving(route, speed) {
    const baseSpeed = speed || 50; // Use provided speed or default to 50 km/h
    const updateInterval = 1000; // Update position every second
    
    let currentPointIndex = 0;
    
    while (currentPointIndex < route.length - 1) {
        // Get current and next points
        const currentPoint = route[currentPointIndex];
        const nextPoint = route[currentPointIndex + 1];
        
        // Calculate current speed with some variation
        const currentSpeed = getRandomSpeed(baseSpeed);
        
        // Calculate distance to move in this interval
        const metersPerSecond = (currentSpeed * 1000) / 3600;
        const distanceToMove = metersPerSecond * (updateInterval / 1000);
        
        // Calculate distance to next point
        const distanceToNext = calculateDistance(
            currentPoint[0], currentPoint[1],
            nextPoint[0], nextPoint[1]
        );
        
        // If we can reach next point in this interval
        if (distanceToMove >= distanceToNext) {
            simulateLocation(nextPoint[0], nextPoint[1]);
            currentPointIndex++;
        } else {
            // Interpolate position
            const fraction = distanceToMove / distanceToNext;
            const newLat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * fraction;
            const newLon = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * fraction;
            simulateLocation(newLat, newLon);
        }
        
        sleep(updateInterval);
    }
}

// Handle incoming messages from the web interface
function handleWebMessage(message) {
    if (message.action === 'startSimulation') {
        const config = message.config;
        simulateDriving(config.route, config.speed);
    }
}