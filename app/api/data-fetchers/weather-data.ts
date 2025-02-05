interface WeatherData {
    location: string;
    current: {
        temperature: number;
        humidity: number;
        wind_speed: number;
        wind_direction: number;
        feels_like: number;
        description: string;
        units: {
            temperature: string;
            wind_speed: string;
        };
    };
    hourly: {
        time: string[];
        temperature: number[];
        humidity: number[];
        precipitation_probability: number[];
        visibility: number[];
        uv_index: number[];
        rain: number[];
    };
    daily: {
        time: string[];
        temperature_max: number[];
        temperature_min: number[];
        sunrise: string[];
        sunset: string[];
        uv_index_max: number[];
        precipitation_probability: number[];
    };
    timestamp: string;
}

interface WeatherResponse {
    type: 'weather';
    data: WeatherData;
    status: 'success' | 'error';
}

// interface GeoData {
//     lat: string;
//     lon: string;
// }

const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    95: 'Thunderstorm'
};

export async function fetchWeatherData(location: string): Promise<WeatherResponse | null> {
    try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
        const geoResponse = await fetch(geoUrl, {
            headers: { 'User-Agent': 'AI-Slop-Search' }  // Required by Nominatim's terms of use
        });
        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            throw new Error('Location not found');
        }

        const { lat, lon } = geoData[0];

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,apparent_temperature&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,rain,visibility,uv_index&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        return {
            type: 'weather',
            data: {
                location: location,
                current: {
                    temperature: weatherData.current.temperature_2m,
                    humidity: weatherData.current.relative_humidity_2m,
                    wind_speed: weatherData.current.wind_speed_10m,
                    wind_direction: weatherData.current.wind_direction_10m,
                    feels_like: weatherData.current.apparent_temperature,
                    description: weatherCodes[weatherData.current.weather_code] || 'Unknown',
                    units: {
                        temperature: weatherData.current_units.temperature_2m,
                        wind_speed: weatherData.current_units.wind_speed_10m
                    }
                },
                hourly: {
                    time: weatherData.hourly.time.slice(0, 24),
                    temperature: weatherData.hourly.temperature_2m.slice(0, 24),
                    humidity: weatherData.hourly.relative_humidity_2m.slice(0, 24),
                    precipitation_probability: weatherData.hourly.precipitation_probability.slice(0, 24),
                    rain: weatherData.hourly.rain.slice(0, 24),
                    visibility: weatherData.hourly.visibility.slice(0, 24),
                    uv_index: weatherData.hourly.uv_index.slice(0, 24)
                },
                daily: {
                    time: weatherData.daily.time,
                    temperature_max: weatherData.daily.temperature_2m_max,
                    temperature_min: weatherData.daily.temperature_2m_min,
                    sunrise: weatherData.daily.sunrise,
                    sunset: weatherData.daily.sunset,
                    uv_index_max: weatherData.daily.uv_index_max,
                    precipitation_probability: weatherData.daily.precipitation_probability_max
                },
                timestamp: new Date().toISOString(),
            },
            status: 'success'
        };

    } catch (error) {
        console.error('Weather data fetch error:', error);
        return null;
    }
}