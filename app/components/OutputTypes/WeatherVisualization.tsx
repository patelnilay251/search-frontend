import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

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

interface WeatherVisualizationProps {
    data: WeatherData;
    context: {
        description: string;
    };
}

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const AnimatedWeatherCard = styled(Paper)(() => ({
    animation: `${float} 6s ease-in-out infinite`,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease-in-out',
    color: 'white',
    '&:hover': {
        transform: 'scale(1.02)',
    },
}));

const WeatherVisualization: React.FC<WeatherVisualizationProps> = ({ data }) => {
    const hourlyData = useMemo(() => {
        return data.hourly.time.map((time, index) => ({
            time: new Date(time).getHours() + ':00',
            temperature: data.hourly.temperature[index],
            precipitation: data.hourly.precipitation_probability[index],
        }));
    }, [data.hourly]);

    const getWeatherBackground = (description: string) => {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('cloud')) return 'linear-gradient(to bottom, #4B6CB7, #182848)';
        if (lowerDesc.includes('rain')) return 'linear-gradient(to bottom, #373B44, #4286f4)';
        if (lowerDesc.includes('clear')) return 'linear-gradient(to bottom, #2193b0, #6dd5ed)';
        return 'linear-gradient(to bottom, #2C3E50, #3498DB)';
    };

    return (
        <AnimatedWeatherCard
            elevation={3}
            sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                color: 'white',
                background: getWeatherBackground(data.current.description),
            }}
        >
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                }}
            >
                {data.location}
            </Typography>

            <Typography
                variant="h2"
                sx={{ mb: 2, fontSize: { xs: '2.5rem', sm: '3rem' } }}
            >
                {Math.round(data.current.temperature)}
                {data.current.units.temperature}
            </Typography>

            <Typography variant="h6" sx={{ mb: 3 }}>
                Feels like {Math.round(data.current.feels_like)}
                {data.current.units.temperature}
            </Typography>

            {/* Weather Metrics Grid */}
            <Grid container spacing={4} sx={{ mt: 1 }}>
                {/* Humidity */}
                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WaterDropIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                Humidity
                            </Typography>
                            <Typography variant="h6">
                                {data.current.humidity}%
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                {/* Wind Speed */}
                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AirIcon sx={{ fontSize: { xs: 30, sm: 40 }, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                Wind Speed
                            </Typography>
                            <Typography variant="h6">
                                {data.current.wind_speed} {data.current.units.wind_speed}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                {/* Wind Direction */}
                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AirIcon
                            sx={{
                                fontSize: { xs: 30, sm: 40 },
                                color: 'primary.main',
                                transform: 'rotate(45deg)',
                            }}
                        />
                        <Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.7)">
                                Wind Direction
                            </Typography>
                            <Typography variant="h6">
                                {data.current.wind_direction}&deg;
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* Hourly Forecast Chart */}
            <Box sx={{ height: { xs: 150, sm: 200 }, mt: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlyData}>
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" />
                        <YAxis stroke="rgba(255,255,255,0.7)" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: 'white',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#fff"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>

            {/* Daily Forecast Summary */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    7-Day Forecast
                </Typography>
                <Grid container spacing={2}>
                    {data.daily.time.map((day, index) => (
                        <Grid item xs={12} sm={6} md={3} key={day}>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2">
                                    {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
                                </Typography>
                                <Typography variant="body1">
                                    {Math.round(data.daily.temperature_max[index])}° /{' '}
                                    {Math.round(data.daily.temperature_min[index])}°
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </AnimatedWeatherCard>
    );
};

export default WeatherVisualization;