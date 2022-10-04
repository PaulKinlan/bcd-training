
import template from "../../flora.ts";
import { FeatureConfig } from "../types.d.ts";

export default function renderFeatures(features: FeatureConfig, selectedFeatures: Set<string>): ReadableStream<any> {
  return template`<fieldset>
  <legend>Features</legend>${Object.entries(features).map(([feature, details]) => template`<input type=checkbox name="feature-${feature}" id="feature-${feature}" ${selectedFeatures.has(feature) ? template`checked=checked` : template``}>
  <label for="feature-${feature}">${details.name}</label>`)}</fieldset>`;
}
