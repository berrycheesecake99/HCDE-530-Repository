export type Member = { name: string; status: "online" | "offline" };
export type Group = { id: string; name: string; members: Member[] };

export const GROUPS: Group[] = [
  { id: "hcde", name: "Human Centered Design & Engineering", members: [
    { name: "Priya S.", status: "online" }, { name: "Jordan M.", status: "offline" }, { name: "Anika R.", status: "online" },
  ]},
  { id: "cse", name: "Computer Science & Engineering", members: [
    { name: "Kevin L.", status: "online" }, { name: "Maya T.", status: "offline" }, { name: "Sam K.", status: "online" }, { name: "Lisa W.", status: "offline" },
  ]},
  { id: "info", name: "Information School (iSchool)", members: [
    { name: "David C.", status: "online" }, { name: "Rachel P.", status: "offline" },
  ]},
  { id: "psych", name: "Psychology", members: [
    { name: "Emma B.", status: "online" }, { name: "Tyler N.", status: "online" }, { name: "Zoe H.", status: "offline" },
  ]},
  { id: "bio", name: "Biology", members: [
    { name: "Alex J.", status: "offline" }, { name: "Mia F.", status: "online" },
  ]},
  { id: "business", name: "Foster School of Business", members: [
    { name: "Chris D.", status: "offline" }, { name: "Noor A.", status: "online" }, { name: "Ethan R.", status: "offline" },
  ]},
  { id: "nursing", name: "School of Nursing", members: [
    { name: "Sofia G.", status: "online" }, { name: "Liam O.", status: "offline" },
  ]},
  { id: "art", name: "School of Art + Art History + Design", members: [
    { name: "Jade T.", status: "online" }, { name: "Owen P.", status: "offline" }, { name: "Isla M.", status: "online" },
  ]},
  { id: "ee", name: "Electrical & Computer Engineering", members: [
    { name: "Ravi S.", status: "online" }, { name: "Anna K.", status: "offline" },
  ]},
  { id: "polisci", name: "Political Science", members: [
    { name: "Ben W.", status: "offline" }, { name: "Clara Z.", status: "online" },
  ]},
  { id: "comms", name: "Communication", members: [
    { name: "Lily H.", status: "online" }, { name: "James R.", status: "offline" }, { name: "Tara S.", status: "online" },
  ]},
  { id: "chem", name: "Chemistry", members: [
    { name: "Oscar L.", status: "offline" }, { name: "Nina C.", status: "online" },
  ]},
  { id: "arch", name: "Architecture", members: [
    { name: "Leo F.", status: "online" }, { name: "Hannah B.", status: "offline" },
  ]},
  { id: "law", name: "School of Law", members: [
    { name: "Marcus J.", status: "offline" }, { name: "Emily V.", status: "online" },
  ]},
  { id: "pubhealth", name: "School of Public Health", members: [
    { name: "Diana Q.", status: "online" }, { name: "Noah G.", status: "offline" }, { name: "Ava P.", status: "online" },
  ]},
];

export type Hotspot = { name: string; lat: number; lng: number; radius: number; tip: string };

export const COMMUNITY_HOTSPOTS: Hotspot[] = [
  { name: "The Ave north of 45th", lat: 47.6618, lng: -122.3131, radius: 200,
    tip: "Students report this stretch feels unsafe after dark. Consider a parallel street." },
  { name: "Jack in the Box intersection", lat: 47.6635, lng: -122.3131, radius: 100,
    tip: "Frequently flagged for drug activity and phone thefts at night." },
  { name: "Safeway area", lat: 47.6658, lng: -122.3131, radius: 120,
    tip: "Multiple students report uncomfortable encounters here at night." },
  { name: "Joy Mini Mart / 7-Eleven", lat: 47.6642, lng: -122.3131, radius: 80,
    tip: "Loitering reported by students; stay alert when passing at night." },
  { name: "Alleys between 45th–52nd", lat: 47.6650, lng: -122.3145, radius: 150,
    tip: "Students strongly recommend avoiding alleys in this area at night." },
  { name: "Cowen Park playground area", lat: 47.6685, lng: -122.3180, radius: 130,
    tip: "Flagged as risky after dark. Stick to well-lit paths." },
  { name: "65th St underpass", lat: 47.6757, lng: -122.3131, radius: 100,
    tip: "Getting sketchy even in daytime per recent student reports." },
  { name: "Near I-5 corridor (U-District)", lat: 47.6613, lng: -122.3200, radius: 180,
    tip: "More isolated with fewer witnesses. Stick to busier streets." },
  { name: "Bus stop at 45th & University Way", lat: 47.6614, lng: -122.3131, radius: 80,
    tip: "Be careful around this bus stop at night." },
];

export const STORAGE = {
  groups: "safewalk_groups",
  reports: "safewalk_reports",
  displayName: "safewalk_display_name",
};

export function getJoinedIds(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE.groups) || "[]"); } catch { return []; }
}
export function setJoinedIds(ids: string[]) {
  localStorage.setItem(STORAGE.groups, JSON.stringify(ids));
  window.dispatchEvent(new Event("safewalk:groups"));
}

export type Report = { id: string; type: string; note: string; createdAt: number; netid: string; lat?: number; lng?: number };
export function getReports(): Report[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE.reports) || "[]"); } catch { return []; }
}
export function addReport(r: Report) {
  const next = [r, ...getReports()];
  localStorage.setItem(STORAGE.reports, JSON.stringify(next));
  window.dispatchEvent(new Event("safewalk:reports"));
}

export function scoreColor(score: number): string {
  if (score >= 75) return "#8c2d04";
  if (score >= 55) return "#f03b20";
  if (score >= 25) return "#fec44f";
  return "#2ca25f";
}