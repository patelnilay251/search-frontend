"use client";

import React, { useRef, useEffect } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { motion } from "framer-motion";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme as useNextTheme } from "next-themes";

// Define the types for your data
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

// Dark map style configuration (used when the theme is dark)
const darkMapStyle = {
  version: 8,
  sources: {
    openmaptiles: {
      type: "vector",
      url: "https://api.maptiler.com/tiles/v3/tiles.json?key=kd1i2XYmnhBqIbOpdJlb",
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0c1f3f" },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: { "fill-color": "#1e3a5f" },
    },
    {
      id: "landcover",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landcover",
      paint: { "fill-color": "#162b4d" },
    },
    {
      id: "landuse",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      paint: { "fill-color": "#1c3358" },
    },
    {
      id: "road",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      paint: {
        "line-color": "#2c4c7c",
        "line-width": 1,
      },
    },
    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      paint: { "fill-color": "#1e3a5f" },
    },
  ],
} as maplibregl.StyleSpecification;

const GeographicVisualization: React.FC<GeographicVisualizationProps> = ({
  data,
  context,
}) => {
  const { formattedAddress, coordinates } = data;
  const { description } = context;

  // Reference to the map container DOM element
  const mapContainer = useRef<HTMLDivElement>(null);
  // Reference to the map instance (to prevent re-initialization)
  const map = useRef<maplibregl.Map | null>(null);

  // Using next-themes to determine the current theme ("dark" or "light")
  const { theme } = useNextTheme();

  // Initialize the MapLibre map
  useEffect(() => {
    if (map.current) return; // initialize only once

    map.current = new maplibregl.Map({
      container: mapContainer.current!,
      style:
        theme === "dark"
          ? darkMapStyle
          : "https://api.maptiler.com/maps/streets/style.json?key=kd1i2XYmnhBqIbOpdJlb",
      center: [coordinates.lng, coordinates.lat],
      zoom: 14,
      pitch: 60,
      bearing: -30,
    });

    // When the map loads, add the 3D buildings layer
    map.current.on("load", () => {
      map.current!.addLayer({
        id: "3d-buildings",
        source: "openmaptiles",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": theme === "dark" ? "#3a5f8f" : "#aaa",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            15.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.8,
        },
      });
    });
  }, [theme, coordinates.lng, coordinates.lat]);

  // Update the map style when the theme changes
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(
        theme === "dark"
          ? darkMapStyle
          : "https://api.maptiler.com/maps/streets/style.json?key=kd1i2XYmnhBqIbOpdJlb"
      );
    }
  }, [theme]);

  // Fly to the provided coordinates when the data changes
  useEffect(() => {
    if (map.current) {
      map.current.flyTo({
        center: [coordinates.lng, coordinates.lat],
        zoom: 16,
        pitch: 70,
        bearing: -45,
        duration: 2000,
      });
    }
  }, [coordinates.lng, coordinates.lat]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            width: "100%",
            height: "400px",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
            bgcolor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Overlay Paper with location details */}
          <Paper
            elevation={3}
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1000,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              p: 2,
              maxWidth: "300px",
              borderRadius: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 1, color: "rgba(255, 255, 255, 0.7)" }}
            >
              Location Details
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {formattedAddress}
            </Typography>
          </Paper>
          {/* Map container */}
          <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "0.875rem",
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </motion.div>
    </>
  );
};

export default GeographicVisualization;