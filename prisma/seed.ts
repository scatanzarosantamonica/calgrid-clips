import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL || "file:./dev.db";
const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed admin user
  const passwordHash = await bcrypt.hash("Calgrid123!", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@calgrid.com" },
    update: {},
    create: {
      email: "admin@calgrid.com",
      passwordHash,
      name: "CalGrid Admin",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Seed sample articles
  const sampleArticles = [
    {
      title: "California Approves Major Transmission Line Expansion for Renewable Energy",
      outlet: "Los Angeles Times",
      outletDomain: "latimes.com",
      url: "https://latimes.com/environment/story/2026-04-01-transmission-expansion",
      snippet: "State regulators have greenlit a sweeping plan to build hundreds of miles of new high-voltage transmission lines, aiming to carry solar and wind power from remote areas to population centers.",
      publishedAt: new Date("2026-04-06T14:00:00Z"),
      status: "APPROVED",
      section: "transmission",
      priority: true,
      tags: JSON.stringify(["transmission", "renewable energy", "CPUC"]),
      keywordsMatched: JSON.stringify(["transmission", "renewable"]),
    },
    {
      title: "IBEW Local 47 Secures Historic Workforce Agreement for Grid Modernization",
      outlet: "Utility Dive",
      outletDomain: "utilitydive.com",
      url: "https://utilitydive.com/news/ibew-grid-modernization-agreement/2026",
      snippet: "The International Brotherhood of Electrical Workers Local 47 has finalized a landmark project labor agreement covering California's largest grid modernization initiative.",
      publishedAt: new Date("2026-04-05T10:30:00Z"),
      status: "APPROVED",
      section: "labor",
      tags: JSON.stringify(["labor", "IBEW", "workforce"]),
      keywordsMatched: JSON.stringify(["labor", "workforce"]),
    },
    {
      title: "PG&E Files $2.8B Rate Case for Grid Hardening and Undergrounding",
      outlet: "S&P Global",
      outletDomain: "spglobal.com",
      url: "https://spglobal.com/commodity-insights/pge-rate-case-2026",
      snippet: "Pacific Gas & Electric has submitted a general rate case requesting $2.8 billion to accelerate wildfire hardening, including 1,200 miles of undergrounding across Northern California.",
      publishedAt: new Date("2026-04-05T08:00:00Z"),
      status: "APPROVED",
      section: "energy",
      priority: true,
      tags: JSON.stringify(["PG&E", "rate case", "wildfire"]),
      keywordsMatched: JSON.stringify(["PG&E", "rate case"]),
    },
    {
      title: "Riverside County Supervisors Approve Gateway Connector Route Through Pass Area",
      outlet: "Press-Enterprise",
      outletDomain: "pe.com",
      url: "https://pe.com/2026/04/04/riverside-gateway-connector-approval",
      snippet: "The Riverside County Board of Supervisors voted 4-1 to approve the preferred route for the Gateway Connector transmission project through the San Gorgonio Pass.",
      publishedAt: new Date("2026-04-04T16:00:00Z"),
      status: "APPROVED",
      section: "local",
      tags: JSON.stringify(["Riverside County", "Gateway Connector"]),
      keywordsMatched: JSON.stringify(["Gateway Connector"]),
    },
    {
      title: "CAISO Warns of Summer Reliability Risks Without New Transmission Capacity",
      outlet: "E&E News",
      outletDomain: "eenews.net",
      url: "https://eenews.net/articles/caiso-summer-reliability-2026",
      snippet: "The California Independent System Operator has flagged potential reliability concerns for summer 2026, citing delayed transmission projects and rising peak demand forecasts.",
      publishedAt: new Date("2026-04-04T12:00:00Z"),
      status: "APPROVED",
      section: "transmission",
      tags: JSON.stringify(["CAISO", "reliability", "summer"]),
      keywordsMatched: JSON.stringify(["CAISO", "transmission"]),
    },
    {
      title: "Solar Farm Workers in Imperial Valley Push for Better Safety Standards",
      outlet: "CalMatters",
      outletDomain: "calmatters.org",
      url: "https://calmatters.org/economy/2026/04/solar-farm-workers-safety",
      snippet: "Workers at several large-scale solar installations in Imperial Valley are organizing to demand improved heat safety protocols and better medical access on remote job sites.",
      publishedAt: new Date("2026-04-03T09:00:00Z"),
      status: "APPROVED",
      section: "labor",
      tags: JSON.stringify(["solar", "worker safety", "Imperial Valley"]),
      keywordsMatched: JSON.stringify(["labor", "safety"]),
    },
    {
      title: "SCE Proposes New 500kV Line to Unlock Desert Renewable Resources",
      outlet: "Greentech Media",
      outletDomain: "greentechmedia.com",
      url: "https://greentechmedia.com/articles/read/sce-500kv-desert-line",
      snippet: "Southern California Edison has proposed a 120-mile, 500-kilovolt transmission line to connect 4,000 MW of solar and storage projects in the eastern Mojave to the LA Basin grid.",
      publishedAt: new Date("2026-04-03T14:30:00Z"),
      status: "APPROVED",
      section: "transmission",
      priority: true,
      tags: JSON.stringify(["SCE", "500kV", "desert solar"]),
      keywordsMatched: JSON.stringify(["SCE", "transmission"]),
    },
    {
      title: "Community Groups Challenge Environmental Review for Inland Substation Upgrade",
      outlet: "Desert Sun",
      outletDomain: "desertsun.com",
      url: "https://desertsun.com/story/news/environment/2026/04/02/substation-eir-challenge",
      snippet: "A coalition of community organizations has filed objections to the environmental impact report for a proposed 230kV substation expansion near Beaumont.",
      publishedAt: new Date("2026-04-02T11:00:00Z"),
      status: "QUEUED",
      section: "local",
      tags: JSON.stringify(["substation", "EIR", "Beaumont"]),
      keywordsMatched: JSON.stringify(["substation"]),
    },
  ];

  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { url: article.url },
      update: {},
      create: article,
    });
  }
  console.log(`✅ Seeded ${sampleArticles.length} sample articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
