import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

// Corporate proxies / antivirus often break Sanity HTTPS with
// SELF_SIGNED_CERT_IN_CHAIN. Opt-in for local dev only.
if (
  process.env.NODE_ENV === "development" &&
  process.env.SANITY_INSECURE_TLS === "1"
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
  token: process.env.SANITY_API_TOKEN,
});

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source) {
  if (!source) return null;
  return builder.image(source);
}

export async function fetchSanity(query, params = {}) {
  return client.fetch(query, params);
}
