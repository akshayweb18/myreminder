import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Transpile @fullcalendar/* so Turbopack/Webpack can process their ESM output.
  // Both bundlers will resolve packages via the `exports` map in each package.json
  // (e.g. `"."` → `"./index.js"` for ESM), so no manual alias wiring is needed.
  transpilePackages: [
    "@fullcalendar/core",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/list",
    "@fullcalendar/interaction",
  ],
  // Empty turbopack key silences the "webpack config but no turbopack config" warning.
  turbopack: {},
};

export default nextConfig;
