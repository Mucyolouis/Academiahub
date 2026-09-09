import { siteUrl } from "./organisation";

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  url: siteUrl,
  name: "IvomoHub",
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
};
