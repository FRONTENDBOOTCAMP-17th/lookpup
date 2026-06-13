import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["172.30.*.*", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
