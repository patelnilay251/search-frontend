import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AirIcon from '@mui/icons-material/Air';

interface WeatherData {
    location: string;
    current: {
        temperature: number;
        humidity: number;
        wind_speed: number;
        description: string;
        units: {
            temperature: string;
            wind_speed: string;
        };
    };
    timestamp: string;
}

interface WeatherVisualizationProps {
    data: WeatherData;
    context: {
        description: string;
    };
}

const WeatherVisualization: React.FC<WeatherVisualizationProps> = ({ data, context }) => {


    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
            }}
        >
            <Typography variant="h5" gutterBottom>
                {data.location}
            </Typography>

            <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThermostatIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Temperature
                            </Typography>
                            <Typography variant="h6">
                                {data.current.temperature}{data.current.units.temperature}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WaterDropIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Humidity
                            </Typography>
                            <Typography variant="h6">
                                {data.current.humidity}%
                            </Typography>
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AirIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                                Wind Speed
                            </Typography>
                            <Typography variant="h6">
                                {data.current.wind_speed} {data.current.units.wind_speed}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Typography
                variant="body1"
                sx={{
                    mt: 3,
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontStyle: 'italic'
                }}
            >
                {data.current.description}
            </Typography>
        </Paper>
    );
};

export default WeatherVisualization;