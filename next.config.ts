import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // ⭐️ 장소가 바뀌어 IP가 변해도 모든 사설 IP 대역을 허용하는 와일드카드 방식
  allowedDevOrigins: ["172.30.*.*", "192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
