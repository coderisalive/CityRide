const axios = require('axios');
const captainModel = require('../models/captain.model');

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.features && response.data.features.length > 0) {
            const feature = response.data.features[0];
            return {
                ltd: feature.properties.lat,
                lng: feature.properties.lon
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    try {
        const originCoords = await module.exports.getAddressCoordinate(origin);
        const destCoords = await module.exports.getAddressCoordinate(destination);

        const url = `https://api.geoapify.com/v1/routing?waypoints=${originCoords.ltd},${originCoords.lng}|${destCoords.ltd},${destCoords.lng}&mode=drive&apiKey=${apiKey}`;
        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            const properties = response.data.features[0].properties;
            return {
                distance: {
                    value: properties.distance,
                    text: (properties.distance / 1000).toFixed(1) + ' km'
                },
                duration: {
                    value: properties.time,
                    text: Math.round(properties.time / 60) + ' mins'
                },
                status: 'OK'
            };
        } else {
            throw new Error('Unable to fetch distance and time');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.features) {
            return response.data.features.map(feature => feature.properties.formatted).filter(value => value);
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {

    // radius in km


    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ ltd, lng ], radius / 6371 ]
            }
        }
    });

    return captains;


}

module.exports.getRouteCoordinates = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    try {
        const originCoords = await module.exports.getAddressCoordinate(origin);
        const destCoords = await module.exports.getAddressCoordinate(destination);

        const url = `https://api.geoapify.com/v1/routing?waypoints=${originCoords.ltd},${originCoords.lng}|${destCoords.ltd},${destCoords.lng}&mode=drive&apiKey=${apiKey}`;
        const response = await axios.get(url);

        if (response.data && response.data.features && response.data.features.length > 0) {
            const geometry = response.data.features[0].geometry;
            if (geometry.type === 'LineString') {
                return geometry.coordinates.map(coord => [coord[1], coord[0]]);
            } else if (geometry.type === 'MultiLineString') {
                return geometry.coordinates.flat(1).map(coord => [coord[1], coord[0]]);
            }
            return [];
        } else {
            throw new Error('Unable to fetch routing geometry');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}