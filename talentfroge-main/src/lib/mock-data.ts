export const DOMAINS = [
  { id: "ai-ml", name: "AI / Machine Learning", skills: ["Python", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "MLOps", "Transformers", "LangChain"] },
  { id: "data-science", name: "Data Science", skills: ["Python", "Pandas", "SQL", "Statistics", "Scikit-learn", "Visualization", "A/B Testing"] },
  { id: "data-engineering", name: "Data Engineering", skills: ["Spark", "Airflow", "Kafka", "Snowflake", "dbt", "Python", "SQL", "AWS"] },
  { id: "robotics", name: "Robotics", skills: ["ROS", "C++", "SLAM", "Embedded Systems", "Computer Vision", "Control Systems"] },
  { id: "web-dev", name: "Web Development", skills: ["React", "TypeScript", "Node.js", "Next.js", "GraphQL", "PostgreSQL", "Tailwind"] },
  { id: "uiux", name: "UI/UX Design", skills: ["Figma", "Prototyping", "Design Systems", "User Research", "Accessibility", "Motion Design"] },
  { id: "cloud", name: "Cloud Computing", skills: ["AWS", "GCP", "Azure", "Terraform", "Kubernetes", "Docker", "Serverless"] },
  { id: "cybersecurity", name: "Cybersecurity", skills: ["Pen Testing", "SIEM", "OWASP", "Network Security", "Cryptography", "Incident Response"] },
  { id: "devops", name: "DevOps", skills: ["Kubernetes", "Docker", "CI/CD", "Terraform", "Prometheus", "Linux", "Ansible"] },
  { id: "ai-automation", name: "AI Automation", skills: ["LangChain", "n8n", "Zapier", "OpenAI API", "RPA", "Workflows", "Python"] },
  { id: "business-analytics", name: "Business Analytics", skills: ["SQL", "Tableau", "Power BI", "Excel", "Forecasting", "KPIs", "Storytelling"] },
];

export type Candidate = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  domain: string;
  score: number;
  matched: string[];
  missing: string[];
  experience: number;
  education: string;
  summary: string;
  stage: "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";
  interviewScore?: number;
};

const FIRST = ["Aarav", "Maya", "Liam", "Sofia", "Ethan", "Zara", "Noah", "Priya", "Kai", "Amara", "Leo", "Yuki", "Diego", "Nora", "Ravi", "Elena", "Jin", "Chloe", "Omar", "Anya"];
const LAST = ["Patel", "Nguyen", "Garcia", "Kim", "Singh", "Müller", "Rossi", "Khan", "Silva", "Chen", "Walsh", "Okafor", "Reyes", "Petrov", "Larsen", "Tanaka", "Cohen", "Diallo", "Ito", "Vargas"];

function rng(seed: number) { return () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

export const CANDIDATES: Candidate[] = (() => {
  const r = rng(42);
  const stages: Candidate["stage"][] = ["Screening", "Interview", "Offer", "Hired", "Rejected"];
  return Array.from({ length: 28 }).map((_, i) => {
    const domain = DOMAINS[Math.floor(r() * DOMAINS.length)];
    const all = domain.skills;
    const matchedCount = 3 + Math.floor(r() * (all.length - 2));
    const shuffled = [...all].sort(() => r() - 0.5);
    const matched = shuffled.slice(0, matchedCount);
    const missing = shuffled.slice(matchedCount);
    const score = Math.round(45 + (matched.length / all.length) * 55);
    const first = FIRST[Math.floor(r() * FIRST.length)];
    const last = LAST[Math.floor(r() * LAST.length)];
    const name = `${first} ${last}`;
    return {
      id: `c-${i + 1}`,
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@mail.com`,
      avatar: `${first[0]}${last[0]}`,
      domain: domain.name,
      score,
      matched,
      missing,
      experience: 1 + Math.floor(r() * 12),
      education: ["BSc Computer Science", "MSc AI", "BTech IT", "MBA Analytics", "PhD ML"][Math.floor(r() * 5)],
      summary: `${name} brings ${1 + Math.floor(r() * 10)}+ years building production-grade ${domain.name.toLowerCase()} systems with strong cross-functional collaboration.`,
      stage: stages[Math.floor(r() * stages.length)],
      interviewScore: r() > 0.3 ? Math.round(50 + r() * 50) : undefined,
    };
  }).sort((a, b) => b.score - a.score);
})();

export const SKILL_FREQ = (() => {
  const m = new Map<string, number>();
  CANDIDATES.forEach(c => c.matched.forEach(s => m.set(s, (m.get(s) ?? 0) + 1)));
  return Array.from(m.entries()).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count);
})();

export const PIPELINE = ["Screening", "Interview", "Offer", "Hired", "Rejected"].map(stage => ({
  stage,
  count: CANDIDATES.filter(c => c.stage === stage).length,
}));

export const SCORE_DIST = [
  { bucket: "50-60", count: CANDIDATES.filter(c => c.score < 60).length },
  { bucket: "60-70", count: CANDIDATES.filter(c => c.score >= 60 && c.score < 70).length },
  { bucket: "70-80", count: CANDIDATES.filter(c => c.score >= 70 && c.score < 80).length },
  { bucket: "80-90", count: CANDIDATES.filter(c => c.score >= 80 && c.score < 90).length },
  { bucket: "90-100", count: CANDIDATES.filter(c => c.score >= 90).length },
];

export const DOMAIN_DIST = DOMAINS.map(d => ({
  domain: d.name.split(" ")[0],
  count: CANDIDATES.filter(c => c.domain === d.name).length,
})).filter(d => d.count > 0);

export const HIRING_TREND = [
  { month: "Jan", applied: 120, hired: 8 },
  { month: "Feb", applied: 145, hired: 11 },
  { month: "Mar", applied: 180, hired: 14 },
  { month: "Apr", applied: 220, hired: 18 },
  { month: "May", applied: 195, hired: 16 },
  { month: "Jun", applied: 260, hired: 22 },
  { month: "Jul", applied: 305, hired: 27 },
];
