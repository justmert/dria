// seeds the registry files: /data/feeds/*.json and /data/protocols/*.json.
// these hold the feed metadata and the 20 seed protocols with their defillama
// slugs. live metrics, coverage, governance, audits and incidents are written
// separately by the ingest steps.
// run: node scripts/seed-registry.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const write = (rel, obj) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
  console.log("wrote", rel);
};

/* feeds */
/* tier/integration/conflict come from the findings audit */
const feeds = [
  {
    key: "defiscan", name: "DeFiScan", short: "DeFiScan", type: "Rating", tier: "anchor",
    focus: "Decentralization maturity framework: who controls the keys, upgrades, and admin powers.",
    output: "Decentralization stage (0–2) across five risk dimensions.",
    integration: "GitHub data (MIT)", license: "MIT", keyRequired: false,
    conflict: "Independent. Public-good framework run by the DeFi Collective; no protocol funding.",
    url: "defiscan.info",
    methodologyUrl: "https://www.defiscan.info/framework",
    repo: "deficollective/defiscan",
  },
  {
    key: "blockanalitica", name: "BlockAnalitica", short: "BlockAn.", type: "Dashboard", tier: "anchor",
    focus: "Quantitative on-chain risk dashboards for lending markets: liquidations, collateral health, market exposure.",
    output: "Live quantitative dashboard (no single grade).",
    integration: "Open repos (mixed AGPL-3.0 / Apache-2.0); no public API",
    license: "AGPL-3.0 / Apache-2.0", keyRequired: false,
    conflict: "Paid risk engagements with Sky, Aave, and Morpho. Disclosed per market.",
    url: "blockanalitica.com",
    methodologyUrl: "https://blockanalitica.com/",
    repo: "blockanalitica",
  },
  {
    key: "philidor", name: "Philidor Labs", short: "Philidor", type: "Rating", tier: "anchor",
    focus: "Deterministic vector risk scoring across 700+ vaults. Three vectors: asset quality, platform code maturity, governance controls.",
    output: "Per-vault composite tier (Prime / Core / Edge) with a 0–10 score.",
    integration: "Public API, no key", license: "Open methodology", keyRequired: false,
    conflict: "Independent. Open, deterministic methodology; no protocol funding.",
    url: "philidor.io",
    methodologyUrl: "https://docs.philidor.io/docs",
    api: "https://api.philidor.io/v1",
    tierNote: "vault-scoped",
  },
  {
    key: "xerberus", name: "Xerberus", short: "Xerberus", type: "Rating", tier: "anchor",
    focus: "Independent asset and protocol risk ratings. 300+ subscores across 85+ mechanisms; each subscore references a real historical incident.",
    output: "Letter rating (AAA–D) with subscores.",
    integration: "Public API (approval-gated key)", license: "Proprietary API", keyRequired: true,
    conflict: "Investor-funded subscription model. No protocol payments.",
    url: "xerberus.io",
    methodologyUrl: "https://xerberus.gitbook.io/documentation",
  },
  {
    key: "credora", name: "Credora by RedStone", short: "Credora", type: "Rating", tier: "anchor",
    focus: "Institutional-grade credit risk ratings (probability of default / loss) for DeFi protocols and borrowers. Live on Morpho and Spark.",
    output: "Credit-style grade (AAA–C) + probability of loss.",
    integration: "GraphQL API (gated/request; alpha)", license: "Proprietary", keyRequired: true,
    conflict: "Paid by issuers/borrowers requesting ratings. Disclosed per rating.",
    url: "credora.network",
    methodologyUrl: "https://www.credora.network/",
    tierNote: "when public",
  },
  {
    key: "llamarisk", name: "LlamaRisk", short: "LlamaRisk", type: "Research", tier: "anchor",
    focus: "Qualitative protocol risk research and parameter recommendations, plus quantitative monitoring/scoring dashboards. Collateral and governance focus.",
    output: "Long-form risk research and assessments (link-only).",
    integration: "Curated links", license: "Public reports", keyRequired: false,
    conflict: "Funded by Curve and Aave DAOs for risk services. Disclosed per report.",
    url: "llamarisk.com",
    methodologyUrl: "https://www.llamarisk.com/research",
  },
  {
    key: "curatorwatch", name: "CuratorWatch", short: "Curator.", type: "Dashboard", tier: "secondary",
    focus: "Vault-level risk monitoring for Morpho (and similar) curators, tracking allocation risk and curator behavior.",
    output: "Per-curator monitoring dashboard and quality grades.",
    integration: "Scrape (no API)", license: "Unknown", keyRequired: false,
    conflict: "Operated by an unattributed team; funding model undisclosed — flagged for review.",
    url: "curatorwatch.com",
    methodologyUrl: "https://curatorwatch.com/docs",
  },
  {
    key: "zyfai", name: "Zyfai Risk", short: "Zyfai", type: "Dashboard", tier: "secondary",
    focus: "Real-time risk dashboard for DeFi liquidity pools. Tracks risk checks, TVL, APY, and security grades across pools.",
    output: "Pool-level risk checks (e.g. 7/7) + security grade.",
    integration: "Undocumented public JSON API", license: "Unknown", keyRequired: false,
    conflict: "Independent screening tool behind the Zyfai yield agent. Funding model undisclosed.",
    url: "zyf.ai",
    methodologyUrl: "https://docs.zyf.ai/docs/product/overview/introduction",
    api: "https://risk.zyf.ai",
  },
  {
    key: "pigi", name: "pigi.finance", short: "pigi", type: "Dashboard", tier: "secondary",
    focus: "Vault analytics and risk-adjusted yield comparison across 50+ protocols. Tracks historical exploits and holder concentration.",
    output: "Risk-adjusted yield (RAY) ranking.",
    integration: "Demo-gated API; scrape pending review", license: "Unknown", keyRequired: false,
    conflict: "Independent. Funding model undisclosed.",
    url: "pigi.finance",
    methodologyUrl: "https://pigi.finance/defi-api",
  },
  {
    key: "defisafety", name: "DeFiSafety", short: "DeFiSafety", type: "Rating", tier: "secondary",
    focus: "Independent, unpaid Process Quality Reviews (PQR) scoring documentation, testing, and security practices from 0–100%.",
    output: "PQR percentage score (0–100%).",
    integration: "Manual entry (PQR reports)", license: "Public reports", keyRequired: false,
    conflict: "Independent non-profit review. Unsolicited and unpaid by the protocols it rates.",
    url: "defisafety.com",
    methodologyUrl: "https://www.defisafety.com/our_review",
  },
  {
    key: "pharos", name: "Pharos", short: "Pharos", type: "Monitoring", tier: "scoped",
    focus: "Open-source stablecoin peg & safety monitoring (Pharos Watch). Peg stability, liquidity, resilience, decentralization, dependency risk.",
    output: "PegScore + peg/safety monitoring status (stablecoins only).",
    integration: "GitHub (MIT) + public API / on-chain", license: "MIT", keyRequired: false,
    conflict: "Independent open-source public good (TokenBrice). No monetization.",
    url: "pharos.watch",
    methodologyUrl: "https://pharos.watch/methodology/",
    repo: "TokenBrice/pharos-watch",
    api: "https://pharos.watch/api",
    tierNote: "stablecoins",
  },
  {
    key: "defisaver", name: "DeFi Saver", short: "DeFi Sa.", type: "Dashboard", tier: "marginal",
    focus: "Live, position-level loan health and liquidation statistics for leveraged DeFi positions. A management tool, not a protocol-level rater.",
    output: "Position-level loan-health ratio.",
    integration: "SDK (positions-sdk) / on-chain", license: "Open SDK", keyRequired: false,
    conflict: "Commercial position-management product. Lending positions only.",
    url: "defisaver.com",
    methodologyUrl: "https://docs.defisaver.com/",
    repo: "defisaver/defisaver-positions-sdk",
    tierNote: "position-level",
  },
  {
    key: "defipunkd", name: "DeFiPunk'd", short: "DeFiPunk'd", type: "Rating", tier: "secondary",
    focus: "Multi-dimension decentralization registry (Control, Ability to Exit, Autonomy, Open Access, Verifiability) via distributed LLM consensus.",
    output: "Per-dimension grades and a Wood/Bronze/Silver/Gold tier.",
    integration: "Public GitHub JSON dataset; no REST API", license: "Public dataset", keyRequired: false,
    conflict: "Community-curated public good. DeFiScan-derived rubric; partial early-stage coverage.",
    url: "defipunkd.com",
    methodologyUrl: "https://defipunkd.com/methodology",
    repo: "guil-lambert/defipunkd",
    tierNote: "early-stage",
  },
  {
    key: "risklayer", name: "RiskLayer", short: "RiskLayer", type: "Rating", tier: "unverified",
    focus: "Economic security middleware on EigenLayer. “Proof of Risk” consensus for validator-attested risk scores. Dormant / pre-launch.",
    output: "(Unverified — no public dataset; site unreachable.)",
    integration: "None verified", license: "Unknown", keyRequired: false,
    conflict: "No public product confirmed. Flagged, not populated.",
    url: "risklayer.xyz",
  },
  {
    key: "defisphere", name: "DeFi Sphere", short: "DeFi Sp.", type: "Rating", tier: "unverified",
    focus: "Multi-dimensional risk scoring (likely BlockAnalitica's Sphere). Public scope could not be confirmed against the RFP description.",
    output: "(Unverified — no public dataset / request-only.)",
    integration: "No public API (request only)", license: "Unknown", keyRequired: false,
    conflict: "Public scope unconfirmed. Flagged, not populated.",
    url: "defi-sphere.com",
  },
];

/* protocols */
/* defillama slugs checked against api.llama.fi/protocols (2026-06) */
const protocols = [
  {
    key: "lido", name: "Lido", cat: "Liquid Staking", metric: "tvl",
    site: "lido.fi", token: "stETH",
    desc: "The largest liquid staking protocol. Users stake ETH and receive stETH, a rebasing token representing staked ETH plus rewards, widely used as DeFi collateral.",
    versions: [], defillama: { slugs: ["lido"] },
    governance: { defiscanSlug: "lido" },
  },
  {
    key: "aave", name: "Aave", cat: "Lending", metric: "tvl",
    site: "aave.com", token: "AAVE / GHO",
    desc: "A decentralized non-custodial liquidity protocol where users supply and borrow assets. Markets are isolated by version and risk parameters are governed onchain.",
    versions: ["Aave V3", "Aave V4", "GHO"], defillama: { slugs: ["aave-v3", "aave-v4"] },
    governance: { defiscanSlug: "aave" },
  },
  {
    key: "spark", name: "Spark", cat: "Lending", metric: "tvl",
    site: "spark.fi", token: "sUSDS / USDS",
    desc: "A Sky (MakerDAO) sub-protocol. SparkLend is an Aave-v3-based money market and sUSDS is a savings token backed by the Sky ecosystem.",
    versions: ["SparkLend", "sUSDS"], defillama: { slugs: ["sparklend", "spark-savings"] },
    governance: { defiscanSlug: "sky" },
  },
  {
    key: "morpho", name: "Morpho", cat: "Lending", metric: "tvl",
    site: "morpho.org", token: "MORPHO",
    desc: "A minimal, immutable lending primitive. Morpho Blue isolates each market to a single collateral/loan pair with externally set risk parameters.",
    versions: ["Morpho Blue", "Morpho Optimizers"], defillama: { slugs: ["morpho-blue"] },
    governance: { defiscanSlug: "morpho" },
  },
  {
    key: "uniswap", name: "Uniswap", cat: "DEX / AMM", metric: "tvl",
    site: "uniswap.org", token: "UNI",
    desc: "The largest decentralized exchange. Concentrated-liquidity AMM (v3), hooks-based pools (v4), and intent-based routing (UniswapX).",
    versions: ["Uniswap v3", "Uniswap v4", "UniswapX"], defillama: { slugs: ["uniswap-v3", "uniswap-v4"] },
    governance: { defiscanSlug: "uniswap" },
  },
  {
    key: "compound", name: "Compound", cat: "Lending", metric: "tvl",
    site: "compound.finance", token: "COMP",
    desc: "A pioneering algorithmic money market. v2 is a pooled model; v3 (Comet) uses single-borrowable-asset isolated markets.",
    versions: ["Compound v2", "Compound v3"], defillama: { slugs: ["compound-v3", "compound-v2"] },
    governance: { defiscanSlug: "compound" },
  },
  {
    key: "morpho-vaults", name: "Morpho Vaults", cat: "Yield / Vault", metric: "tvl",
    site: "morpho.org", token: "—",
    desc: "Curated MetaMorpho vaults that allocate deposits across Morpho Blue markets. Risk is delegated to named curators with public allocation policies.",
    versions: [], defillama: { slugs: ["morpho-blue"] },
  },
  {
    key: "rocket-pool", name: "Rocket Pool", cat: "Liquid Staking", metric: "tvl",
    site: "rocketpool.net", token: "rETH / RPL",
    desc: "A decentralized ETH staking protocol. Node operators run validators with reduced bonds backed by RPL collateral; rETH is the liquid staking token.",
    versions: [], defillama: { slugs: ["rocket-pool"] },
    governance: { defiscanSlug: "rocketpool" },
  },
  {
    key: "curve", name: "Curve", cat: "DEX / AMM", metric: "tvl",
    site: "curve.finance", token: "CRV / crvUSD",
    desc: "Stablecoin and LST AMM infrastructure optimized for low-slippage swaps between like-priced assets, plus the crvUSD CDP stablecoin.",
    versions: ["Curve DEX", "crvUSD"], defillama: { slugs: ["curve-dex", "curve-llamalend"] },
    governance: { defiscanSlug: "curve" },
  },
  {
    key: "pendle", name: "Pendle", cat: "Yield / Vault", metric: "tvl",
    site: "pendle.finance", token: "PENDLE",
    desc: "Yield tokenization and fixed-rate trading. Splits yield-bearing assets into principal (PT) and yield (YT) tokens traded on a specialized AMM.",
    versions: [], defillama: { slugs: ["pendle"] },
  },
  {
    key: "fluid", name: "Fluid", cat: "Lending", metric: "tvl",
    site: "fluid.io", token: "FLUID",
    desc: "An Instadapp protocol combining lending and a DEX in a single liquidity layer, enabling high collateral efficiency and smart-debt positions.",
    versions: ["Fluid Lending", "Fluid DEX"], defillama: { slugs: ["fluid-lending", "fluid-dex"] },
  },
  {
    key: "liquity", name: "Liquity", cat: "Lending", metric: "tvl",
    site: "liquity.org", token: "LUSD / BOLD",
    desc: "An immutable, governance-free CDP protocol. v1 issues LUSD against ETH; v2 (BOLD) adds user-set interest rates and multiple collaterals.",
    versions: ["Liquity v1", "Liquity v2"], defillama: { slugs: ["liquity-v1", "liquity-v2"] },
    governance: { defiscanSlug: "liquity" },
  },
  {
    key: "euler", name: "Euler", cat: "Lending", metric: "tvl",
    site: "euler.finance", token: "EUL",
    desc: "Modular vault lending via the Euler Vault Kit. Permissionless vaults are connected by an Ethereum Vault Connector to share collateral.",
    versions: ["Euler v2"], defillama: { slugs: ["euler-v2"] },
    governance: { defiscanSlug: "euler" },
  },
  {
    key: "balancer", name: "Balancer", cat: "DEX / AMM", metric: "tvl",
    site: "balancer.fi", token: "BAL",
    desc: "A programmable liquidity AMM supporting weighted, stable, and boosted pools, and the foundation for many LST/LRT liquidity venues.",
    versions: ["Balancer v2", "Balancer v3"], defillama: { slugs: ["balancer-v2", "balancer-v3"] },
    governance: { defiscanSlug: "balancer" },
  },
  {
    key: "mellow", name: "Mellow", cat: "Yield / Vault", metric: "tvl",
    site: "mellow.finance", token: "—",
    desc: "Modular LRT (liquid restaking token) vault infrastructure. Curators configure restaking strategies on top of EigenLayer and Symbiotic.",
    versions: [], defillama: { slugs: ["mellow-restaking", "mellow-core"] },
  },
  {
    key: "yearn", name: "Yearn Finance", cat: "Yield / Vault", metric: "tvl",
    site: "yearn.fi", token: "YFI",
    desc: "Automated yield vaults that route deposits across strategies. V3 introduces tokenized, composable strategies and role-based vault management.",
    versions: ["Yearn v2", "Yearn v3"], defillama: { slugs: ["yearn-finance"] },
  },
  {
    key: "gearbox", name: "Gearbox", cat: "Lending", metric: "tvl",
    site: "gearbox.fi", token: "GEAR",
    desc: "A composable leverage protocol. Credit accounts let users borrow and deploy leverage across whitelisted DeFi integrations.",
    versions: [], defillama: { slugs: ["gearbox"] },
  },
  {
    key: "cowswap", name: "CoW Swap", cat: "Swap Aggregator", metric: "volume",
    site: "cow.fi", token: "COW",
    desc: "An intent-based DEX aggregator. Orders are batch-auctioned and settled by competing solvers, providing MEV protection and coincidence-of-wants.",
    versions: [], defillama: { slugs: ["cowswap"], dimension: "aggregators" },
  },
  {
    key: "1inch", name: "1inch", cat: "Swap Aggregator", metric: "volume",
    site: "1inch.io", token: "1INCH",
    desc: "A DEX aggregator and limit-order protocol routing trades across liquidity sources via the Pathfinder and Fusion intent systems.",
    versions: [], defillama: { slugs: ["1inch"], dimension: "aggregators" },
  },
  {
    key: "zerox", name: "0x / Matcha", cat: "Swap Aggregator", metric: "volume",
    site: "matcha.xyz", token: "ZRX",
    desc: "The 0x protocol provides swap APIs and RFQ liquidity; Matcha is its consumer front-end aggregating onchain and professional market-maker quotes.",
    versions: [], defillama: { slugs: ["0x"], dimension: "aggregators" },
  },
];

feeds.forEach((f) => write(`data/feeds/${f.key}.json`, f));
protocols.forEach((p) => write(`data/protocols/${p.key}.json`, p));
console.log(`\n${feeds.length} feeds, ${protocols.length} protocols seeded.`);
