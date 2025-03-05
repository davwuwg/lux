import { Metadata } from "next"

// Default metadata values
export const defaultMetadata: Metadata = {
  title: "Executive Management Suite",
  description: "Private enterprise management solution for luxury businesses",
  keywords: ["management", "luxury", "executive", "enterprise", "dashboard"],
  authors: [{ name: "Luxury Management Team" }],
  creator: "Luxury Management Inc.",
  publisher: "Luxury Management Inc.",
  metadataBase: new URL("https://luxury-management.example.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://luxury-management.example.com",
    title: "Executive Management Suite",
    description: "Private enterprise management solution for luxury businesses",
    siteName: "Luxury Management",
    images: [
      {
        url: "https://luxury-management.example.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Luxury Management OG Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Executive Management Suite",
    description: "Private enterprise management solution for luxury businesses",
    images: ["https://luxury-management.example.com/twitter-image.jpg"],
  },
  manifest: "https://luxury-management.example.com/manifest.json",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
    { rel: "mask-icon", url: "/safari-pinned-tab.svg" },
  ],
};

/**
 * Generate metadata for a specific page
 * @param options Custom metadata options to override defaults
 * @returns Metadata object
 */
export function generateMetadata(options: Partial<Metadata> = {}): Metadata {
  const merged = structuredClone(defaultMetadata);

  // Merge nested objects
  if (options.openGraph) {
    merged.openGraph = {
      ...merged.openGraph,
      ...options.openGraph,
    };
  }

  if (options.twitter) {
    merged.twitter = {
      ...merged.twitter,
      ...options.twitter,
    };
  }

  // For icons, simply use the new icons if provided, otherwise keep defaults
  if (options.icons) {
    merged.icons = options.icons;
  }

  // Override other metadata properties
  return {
    ...merged,
    ...options,
  };
}