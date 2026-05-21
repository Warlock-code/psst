import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.psst.app",
  appName: "Psst",
  webDir: "public",
  server: {
    url: "https://psst-kappa.vercel.app/",
    cleartext: false,
  },
}

export default config