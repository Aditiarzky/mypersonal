import type { Skill } from "#lib";

export interface LandingNavLink {
  href: string;
  label: string;
}

export interface SkillGroup {
  category: string;
  items: Skill[];
}

export interface ContactForm {
  subject: string;
  message: string;
}
