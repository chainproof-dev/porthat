export interface Profile {
  name: string;
  handle: string;
  avatar: string;
  banner: string;
  bio: string;
  location: string;
  resumeUrl: string;
  email: string;
}

export interface Social {
  name: string;
  url: string;
  icon: string;
}

export interface Skill {
  name: string;
  icon: string;
  color: string;
}

export interface Experience {
  company: string;
  role: string;
  type: string;
  period: string;
  location: string;
  details: string[];
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  tags: string[];
  github: string | null;
  demo: string | null;
  featured: boolean;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  coverImage?: string;
  readingTime?: string;
  content?: string;
  author?: string;
  metaDescription?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  period: string;
  location: string;
  grade?: string;
  details?: string[];
}

export interface BlogConfig {
  /** Blog page title */
  title: string;
  /** Blog page subtitle */
  subtitle: string;
  /** Blog page description/tagline */
  description: string;
}

export interface PortfolioData {
  theme: string;
  github: string;
  illustration?: boolean;
  blogConfig?: BlogConfig;
  profile: Profile;
  roles: string[];
  socials: Social[];
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
  blogs: BlogPost[];
  quotes: string[];
}
