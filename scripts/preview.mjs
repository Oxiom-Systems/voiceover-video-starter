import { loadProject } from "./lib/project.mjs";
import { startStaticServer } from "./lib/server.mjs";

const project = await loadProject();
const port = Number.parseInt(process.env.PORT ?? "4173", 10);
const { url } = await startStaticServer({ pageFile: project.pageFile, port });
console.log(`Preview: ${url}`);
console.log("Press Ctrl+C to stop.");
