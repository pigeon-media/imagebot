import fs from "fs-extra";
import os from "node:os";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { GraphQLClient, gql } from "graphql-request";
import fetch from "node-fetch";
import { fileTypeFromBuffer } from "file-type";
import _ from "lodash";

const FILE_CACHE_DIR = join(os.tmpdir(), "imagebot");

await fs.mkdirp(FILE_CACHE_DIR);

const GRAPHQL_URL = "https://api.facetaste.app/graphql";

const client = new GraphQLClient(GRAPHQL_URL, {
  fetch,
});

async function createBufferFromUrl(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function bufferToDataUri(buffer, mimeType) {
  return `data:${mimeType};charset=utf-8;base64,${buffer.toString("base64")}`;
}

async function createDataUriFromStaticUrl(url) {
  const buffer = await createBufferFromUrl(url);
  const { mime } = await fileTypeFromBuffer(buffer);
  if (mime) return bufferToDataUri(buffer, mime);
  return null;
}

function hash(value) {
  return createHash("sha1").update(JSON.stringify(value)).digest("hex");
}

async function createCacheDataUri(url) {
  if (!url) {
    return null;
  }

  const key = hash(url);
  const tmpfile = join(FILE_CACHE_DIR, key);

  if (await fs.pathExists(tmpfile)) {
    const dataURI = await fs.readFile(tmpfile, "utf8");
    return {
      data: dataURI,
      cacheHits: true,
    };
  }

  const dataURI = await createDataUriFromStaticUrl(url);
  await fs.writeFile(tmpfile, dataURI, { encoding: "utf8" });

  return {
    data: dataURI,
    cacheHits: false,
  };
}

const QUERY_PLACE_WITH_SLUG = gql`
  query ($slug: String!) {
    place: viewPlace(slug: $slug) {
      name
      priceRange
      metrics {
        avgRating
      }
      categories {
        name
      }
      photos: staticPhotos {
        url
      }
      logoUrl
    }
  }
`;



export async function fetchPlace({ slug } = {}) {
  const { place } = await client.request(QUERY_PLACE_WITH_SLUG, { slug });

  const photosAsync = _.chain(place.photos)
    .shuffle()
    .take(3)
    .map((photo) => createCacheDataUri(photo.url))
    .value();

  const [logoData, ...photosData] = await Promise.all([
    createCacheDataUri(place.logoUrl),
    ...photosAsync,
  ]);

  return {
    ...place,
    logoData,
    photosData,
  };
}

