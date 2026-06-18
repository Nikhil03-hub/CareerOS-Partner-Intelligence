// Editorial premium logo strip — real brand SVGs via simpleicons CDN
// (no external API key, served as monochrome SVG files)
export const RECRUITERS = [
  { slug: "amazon",       name: "Amazon" },
  { slug: "google",       name: "Google" },
  { slug: "microsoft",    name: "Microsoft" },
  { slug: "salesforce",   name: "Salesforce" },
  { slug: "adobe",        name: "Adobe" },
  { slug: "servicenow",   name: "ServiceNow" },
  { slug: "cisco",        name: "Cisco" },
  { slug: "oracle",       name: "Oracle" },
  { slug: "intuit",       name: "Intuit" },
  { slug: "deloitte",     name: "Deloitte" },
  { slug: "accenture",    name: "Accenture" },
  { slug: "infosys",      name: "Infosys" },
  { slug: "walmart",      name: "Walmart" },
  { slug: "nvidia",       name: "Nvidia" },
  { slug: "sap",          name: "SAP" },
  { slug: "uber",         name: "Uber" },
  { slug: "atlassian",    name: "Atlassian" },
  { slug: "tcs",          name: "TCS" },
];

// Returns a CDN URL that serves a monochrome SVG of the brand's logo.
export const logoUrl = (slug, color = "0E0E10") => `https://cdn.simpleicons.org/${slug}/${color}`;
