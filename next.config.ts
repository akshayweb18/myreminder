import type { NextConfig } from "next";
import path from "path";

// Resolve to an absolute path inside node_modules
const nm = (...parts: string[]) => path.resolve("node_modules", ...parts);

const nextConfig: NextConfig = {
  // @fullcalendar/* CJS files use literal sub-path requires like
  // require('@fullcalendar/core/internal.cjs') that bypass the exports map.
  // We use transpilePackages + NormalModuleReplacementPlugin to handle them.
  transpilePackages: [
    "@fullcalendar/core",
    "@fullcalendar/react",
    "@fullcalendar/daygrid",
    "@fullcalendar/timegrid",
    "@fullcalendar/list",
    "@fullcalendar/interaction",
  ],
  webpack(config, { webpack }) {
    // Map every known @fullcalendar/* sub-path require to the actual file path
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@fullcalendar\//,
        (resource: { request: string }) => {
          const req = resource.request;

          // Sub-path .cjs requires emitted by the CJS builds themselves
          const subpathMap: Record<string, string> = {
            "@fullcalendar/core/index.cjs":            nm("@fullcalendar/core/index.cjs"),
            "@fullcalendar/core/internal.cjs":         nm("@fullcalendar/core/internal.cjs"),
            "@fullcalendar/core/preact.cjs":           nm("@fullcalendar/core/preact.cjs"),
            "@fullcalendar/daygrid/internal.cjs":      nm("@fullcalendar/daygrid/internal.cjs"),
            "@fullcalendar/timegrid/internal.cjs":     nm("@fullcalendar/timegrid/internal.cjs"),
            "@fullcalendar/list/internal.cjs":         nm("@fullcalendar/list/internal.cjs"),
            "@fullcalendar/interaction/internal.cjs":  nm("@fullcalendar/interaction/internal.cjs"),
            // Top-level package requests → CJS builds
            "@fullcalendar/core":        nm("@fullcalendar/core/index.cjs"),
            "@fullcalendar/react":       nm("@fullcalendar/react/dist/index.cjs"),
            "@fullcalendar/daygrid":     nm("@fullcalendar/daygrid/index.cjs"),
            "@fullcalendar/timegrid":    nm("@fullcalendar/timegrid/index.cjs"),
            "@fullcalendar/list":        nm("@fullcalendar/list/index.cjs"),
            "@fullcalendar/interaction": nm("@fullcalendar/interaction/index.cjs"),
          };

          if (subpathMap[req]) {
            resource.request = subpathMap[req];
          }
        }
      )
    );
    return config;
  },
};

export default nextConfig;
