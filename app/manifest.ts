import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "aldock — Marina bookings, simplified",
    short_name: "aldock",
    description: "Marina bookings, simplified.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a1a2f",
    theme_color: "#0a1a2f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
