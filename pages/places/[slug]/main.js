import { fetchPlace } from "../../../datasource/facetaste-client.js";

export default async ({ params }) => {
  const place = await fetchPlace(params);
  return { place };
};

export const size = () => ({
  width: Math.round(800 * 1.5),
  height: Math.round(418 * 1.5),
});
