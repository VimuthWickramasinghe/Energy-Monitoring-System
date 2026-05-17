import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the monorepo root folder
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
};

export default nextConfig;
