// Summary templates. A meeting carries whichever templates were rendered for
// it; the switcher shows those in registry order, default first.
export type TemplateInfo = { id: string; name: string };

export const MEETING_TEMPLATES: TemplateInfo[] = [
  { id: "standard", name: "Standard" },
  { id: "project-update", name: "Project update" },
  { id: "spiced", name: "Sales — SPICED" },
  { id: "interview", name: "Interview" },
  { id: "one-on-one", name: "One-on-one" },
  { id: "retro", name: "Retrospective" },
];