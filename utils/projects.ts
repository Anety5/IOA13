
// States for different views
export interface OptimizerViewState {
  inputText: string;
  optimizedText: string;
  audience: string;
  goal: string;
  formality: number;
  complexity: number;
  tone: string;
  isProofread: boolean;
  isPlagiarismCheck: boolean;
}

export interface TranslatorViewState {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface GeneratedImage {
    id: string;
    base64: string;
    prompt: string;
}

export interface ImageViewState {
  prompt: string;
  numberOfImages: number;
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  images: GeneratedImage[];
}

export interface ProjectStudioResult {
    type: 'summary' | 'modification';
    content: string;
    prompt?: string;
}

export interface ProjectStudioViewState {
    mainText: string;
    attachments: { data: string; mimeType: string }[];
    results: ProjectStudioResult[];
}

export type AssetContent = OptimizerViewState | TranslatorViewState | ImageViewState | ProjectStudioViewState;

export interface Asset {
  id: string;
  name: string;
  type: 'optimizer' | 'translator' | 'image' | 'project_studio';
  content: AssetContent;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  assets: Asset[];
}

const PROJECTS_KEY = 'ai_studio_projects';

// --- Project Management ---

export const getProjects = (): Project[] => {
  try {
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    return projectsJson ? JSON.parse(projectsJson) : [];
  } catch (error) {
    console.error("Failed to parse projects from localStorage", error);
    return [];
  }
};

const saveProjects = (projects: Project[]) => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage", error);
  }
};

export const addProject = (name: string): Project | null => {
  if (!name.trim()) return null;
  const projects = getProjects();
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    name: name.trim(),
    assets: [],
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
};

export const deleteProject = (projectId: string): void => {
  let projects = getProjects();
  projects = projects.filter(p => p.id !== projectId);
  saveProjects(projects);
};

// --- Asset Management ---

export const addAssetToProject = (
  projectId: string,
  assetName: string,
  assetType: Asset['type'],
  assetContent: AssetContent
): Project | null => {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);

  if (projectIndex === -1) {
    console.error(`Project with id ${projectId} not found.`);
    return null;
  }

  const newAsset: Asset = {
    id: `asset_${Date.now()}`,
    name: assetName.trim(),
    type: assetType,
    content: assetContent,
    createdAt: new Date().toISOString(),
  };

  projects[projectIndex].assets.push(newAsset);
  saveProjects(projects);
  return projects[projectIndex];
};


export const deleteAsset = (projectId: string, assetId: string): void => {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.assets = project.assets.filter(a => a.id !== assetId);
        saveProjects(projects);
    }
};
