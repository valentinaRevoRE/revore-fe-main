export type SkillNivel = 'Compartido' | 'Especializado' | 'Auxiliar';

export interface Skill {
  name: string;
  version: string;
  area: string;
  nivel: SkillNivel;
  description: string;
  updated_at: string;
  size?: string;
  tags?: string[];
}

export interface SkillRelease {
  version: string;
  date: string;
  author: string;
  body: string;
  skill_name?: string;
  html_url?: string;
}

export const NIVEL_COLORS: Record<SkillNivel, string> = {
  Compartido: '#5C8D5C',
  Especializado: '#DD7244',
  Auxiliar: '#2E3C59',
};

export const FILTER_OPTIONS: Array<'Todos' | SkillNivel> = [
  'Todos',
  'Compartido',
  'Especializado',
  'Auxiliar',
];

export function levelToNivel(level: number): SkillNivel {
  if (level === 1) return 'Compartido';
  if (level >= 3) return 'Auxiliar';
  return 'Especializado';
}

export interface SkillCatalogResponse {
  library_name: string;
  library_version: string;
  generated_at: string;
  skills: Array<{
    name: string;
    level: number;
    area: string;
    version: string;
    description: string;
    dependencies: string[];
    updated_at: string;
    zip_path: string;
    zip_size_kb: number;
    github_url: string;
    source_path?: string;
  }>;
}

export function isNew(skill: Skill): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(skill.updated_at) >= sevenDaysAgo;
}

export function isReleaseNew(release: SkillRelease): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(release.date) >= sevenDaysAgo;
}
