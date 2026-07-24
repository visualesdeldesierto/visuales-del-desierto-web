import {defineConfig} from "sanity";
import {structureTool} from "sanity/structure";
import {visionTool} from "@sanity/vision";
import {schemaTypes} from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "Visuales del Desierto",
  projectId: "ud3wwp5r",
  dataset: "production",
  plugins: [structureTool(), visionTool()],
  schema: {types: schemaTypes}
});