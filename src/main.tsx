import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";
import "./index.css";
import { installElementMasks } from "./lib/element-glyphs.ts";

void installElementMasks();

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
