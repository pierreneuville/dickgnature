import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dickgnature — simple agreements",
    short_name: "dickgnature",
    description:
      "Create and sign a two-person agreement with no signer account and a clear proof trail.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f4",
    theme_color: "#7147e8",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
