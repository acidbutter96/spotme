const WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php";
const COMMONS_API_BASE = "https://commons.wikimedia.org/w/api.php";

const SEARCH_LANGUAGES = ["pt", "en", "es"];

interface WikidataSearchResult {
  id: string;
  label?: string;
  description?: string;
}

interface WikidataSearchResponse {
  search: WikidataSearchResult[];
}

interface WikidataEntitiesResponse {
  entities: Record<
    string,
    {
      claims?: Record<
        string,
        Array<{
          mainsnak?: {
            datavalue?: {
              value?: string;
            };
          };
        }>
      >;
    }
  >;
}

interface CommonsImageInfoResponse {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          url?: string;
          mime?: string;
          thumburl?: string;
          thumbmime?: string;
        }>;
      }
    >;
  };
}

async function wikidataFetch<T>(
  params: Record<string, string>,
): Promise<T> {
  const searchParams = new URLSearchParams({
    ...params,
    format: "json",
  });
  const response = await fetch(`${WIKIDATA_API_BASE}?${searchParams.toString()}`, {
    next: { revalidate: 6 * 60 * 60 },
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; MusicStoriesBot/1.0; +http://127.0.0.1)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikidata API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function commonsFetch<T>(
  params: Record<string, string>,
): Promise<T> {
  const searchParams = new URLSearchParams({
    ...params,
    format: "json",
  });
  const response = await fetch(`${COMMONS_API_BASE}?${searchParams.toString()}`, {
    next: { revalidate: 6 * 60 * 60 },
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; MusicStoriesBot/1.0; +http://127.0.0.1)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikimedia Commons API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function pickSearchResult(results: WikidataSearchResult[]): WikidataSearchResult | null {
  if (results.length === 0) {
    return null;
  }
  const preferred = results.find((result) =>
    /musician|singer|band|dj|rapper|music|composer|guitarist/i.test(
      result.description ?? "",
    ),
  );
  return preferred ?? results[0] ?? null;
}

async function searchEntityId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  for (const language of SEARCH_LANGUAGES) {
    const response = await wikidataFetch<WikidataSearchResponse>({
      action: "wbsearchentities",
      search: trimmed,
      language,
      limit: "5",
    });
    const result = pickSearchResult(response.search ?? []);
    if (result?.id) {
      return result.id;
    }
  }

  return null;
}

async function getEntityImageFile(entityId: string): Promise<string | null> {
  const response = await wikidataFetch<WikidataEntitiesResponse>({
    action: "wbgetentities",
    ids: entityId,
    props: "claims",
  });
  const entity = response.entities?.[entityId];
  const claims = entity?.claims?.P18;
  if (!claims || claims.length === 0) {
    return null;
  }
  const value = claims[0]?.mainsnak?.datavalue?.value;
  return typeof value === "string" ? value : null;
}

function normalizeImageUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

function isSupportedMime(mime?: string | null): boolean {
  if (!mime) {
    return false;
  }
  const normalized = mime.toLowerCase();
  return (
    normalized.includes("image/jpeg") ||
    normalized.includes("image/jpg") ||
    normalized.includes("image/png") ||
    normalized.includes("image/gif")
  );
}

function isSupportedExtension(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif")
  );
}

async function resolveCommonsImageUrl(fileName: string): Promise<string | null> {
  const response = await commonsFetch<CommonsImageInfoResponse>({
    action: "query",
    titles: `File:${fileName}`,
    prop: "imageinfo",
    iiprop: "url|mime",
    iiurlwidth: "1200",
  });
  const pages = response.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const imageInfo = page?.imageinfo?.[0];
  if (!imageInfo) {
    return null;
  }

  const candidate = normalizeImageUrl(imageInfo.thumburl ?? imageInfo.url);
  if (!candidate) {
    return null;
  }

  const mime = imageInfo.thumbmime ?? imageInfo.mime;
  if (mime) {
    return isSupportedMime(mime) ? candidate : null;
  }

  return isSupportedExtension(candidate) ? candidate : null;
}

export async function getWikidataArtistImage(input: {
  name?: string;
}): Promise<string | null> {
  if (!input.name) {
    return null;
  }

  const entityId = await searchEntityId(input.name);
  if (!entityId) {
    return null;
  }

  const fileName = await getEntityImageFile(entityId);
  if (!fileName) {
    return null;
  }

  return resolveCommonsImageUrl(fileName);
}
