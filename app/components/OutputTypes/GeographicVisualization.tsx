import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GeographicData {
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  placeId: number;
  locationType: string;
}

interface GeographicVisualizationProps {
  data: GeographicData;
  context: {
    description: string;
  };
}

const GeographicVisualization: React.FC<GeographicVisualizationProps> = ({ data, context }) => {
  const { coordinates, formattedAddress } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ 
        width: '100%',
        height: '400px',
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'rgba(255, 255, 255, 0.05)',
      }}>
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            p: 2,
            maxWidth: '300px',
            borderRadius: 2,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
            Location Details
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {formattedAddress}
          </Typography>
        </Paper>

        <MapContainer
          center={[coordinates.lat, coordinates.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.5
            }}
          >
            <Marker position={[coordinates.lat, coordinates.lng]}>
              <Popup>
                <Typography variant="body2">
                  {formattedAddress}
                </Typography>
              </Popup>
            </Marker>
          </motion.div>
        </MapContainer>
      </Box>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 2, 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}
        >
          {context.description}
        </Typography>
      </motion.div>
    </motion.div>
  );
};

export default GeographicVisualization;