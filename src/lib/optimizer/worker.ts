import type { OptimizeRequest, OptimizationResult } from "./types.ts";
import { optimize } from "./engine.ts";

self.onmessage = (e: MessageEvent<OptimizeRequest>) => {
  const results = optimize(e.data);
  self.postMessage({ type: "done", results } as WorkerResponse);
};

export type WorkerResponse = {
  type: "done";
  results: OptimizationResult[];
};
