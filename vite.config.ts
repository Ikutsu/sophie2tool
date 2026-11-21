import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tanstackRouter from "@tanstack/router-plugin/vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  // bridge/ is the Python game reader; its JSON tables are generated and its
  // probe/*.js are Frida scripts, so the web toolchain leaves it alone.
  fmt: { ignorePatterns: ["bridge/**"] },
  lint: { ignorePatterns: ["bridge/**"], options: { typeAware: true, typeCheck: true } },
  plugins: [tanstackRouter(), react(), tailwindcss()],
});
