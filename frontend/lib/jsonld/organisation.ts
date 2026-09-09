export const siteUrl = process.env.NEXTAUTH_URL as string;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${siteUrl}/#organization`,
  name: "IvomoHub Africa",
  url: `${siteUrl}`,
  logo: `${siteUrl}/logo.png`,
  description:
    "IvomoHub Africa is a comprehensive academic ecosystem connecting students, lecturers, and researchers across African universities.",
  areaServed: {
    "@type": "Continent",
    name: "Africa",
  },
};
