export interface NominatimData {
    lat: string;
    lon: string;
    display_name: string;
    place_id: string;
    type: string;
}

export interface GeographicCoordinates {
    lat: number;
    lng: number;
}

export interface GeographicDataSuccess {
    type: 'geographic';
    data: {
        coordinates: GeographicCoordinates;
        formattedAddress: string;
        placeId: string;
        locationType: string;
    };
    status: 'success';
}

export interface GeographicDataError {
    type: 'geographic';
    data: null;
    status: 'error';
    error: string;
}

export type GeographicDataResponse = GeographicDataSuccess | GeographicDataError;

export async function fetchGeographicData(location: string): Promise<GeographicDataResponse> {
    try {
        const geocodeData: NominatimData = await fetchLocationDetails(location);

        return {
            type: 'geographic',
            data: {
                coordinates: {
                    lat: parseFloat(geocodeData.lat),
                    lng: parseFloat(geocodeData.lon)
                },
                formattedAddress: geocodeData.display_name,
                placeId: geocodeData.place_id,
                locationType: geocodeData.type,
            },
            status: 'success'
        };
    } catch (error: unknown) {
        console.error('Geographic data fetch error:', error);
        return {
            type: 'geographic',
            data: null,
            status: 'error',
            error: 'Failed to fetch geographic data'
        };
    }
}

async function fetchLocationDetails(location: string): Promise<NominatimData> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        {
            headers: {
                'User-Agent': 'AI-Slop-Search' // It's good practice to identify your application
            }
        }
    );
    const data: NominatimData[] = await response.json();
    if (data && data.length > 0) {
        return data[0];
    }
    throw new Error('No location data found');
}