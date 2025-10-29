

// State definitions for different views

export interface OptimizerResult {
    type: 'optimization' | 'summary' | 'modification';
    content: string;
    prompt?: string; // For modifications
}

export interface OptimizerViewState {
  originalText: string;
  attachments: { data: string; mimeType: string }[];
  results: OptimizerResult[];
  options: {
    creativity: number;
    readability: number;
    formality: 'formal' | 'informal' | 'neutral';
    tone: 'professional' | 'friendly' | 'confident' | 'academic';
  };
}

export interface ImageViewState {
  mode: 'generate' | 'edit' | 'analyze';
  prompt: string;
  images: { src: string; prompt: string }[];
  sourceImage: { data: string; mimeType: string } | null;
  analysisResult: string | null;
  isGenerating: boolean;
  error: string | null;
  numberOfImages: number;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export interface TranslatorViewState {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface VideoViewState {
    // To be defined
}

export interface LiveConversationState {
    // to be defined
}

// FIX: Add ProjectStudioResult type to support ProjectStudioView
export interface ProjectStudioResult {
    type: 'summary' | 'modification';
    content: string;
    prompt?: string; // For modifications
}

// FIX: Add ProjectStudioViewState type to support ProjectStudioView
export interface ProjectStudioViewState {
  mainText: string;
  attachments: { data: string; mimeType: string }[];
  results: ProjectStudioResult[];
}


export type AssetContent =
  | OptimizerViewState
  | ImageViewState
  | TranslatorViewState
  | VideoViewState
  | LiveConversationState
  // FIX: Add ProjectStudioViewState to the AssetContent union type
  | ProjectStudioViewState;

export interface Asset {
  id: string;
  name: string;
  // FIX: Add 'project_studio' to the list of valid asset types
  type: 'optimizer' | 'image' | 'translator' | 'video' | 'live' | 'project_studio';
  content: AssetContent;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  assets: Asset[];
  createdAt: string;
  updatedAt: string;
}

const PROJECTS_KEY = 'ioai_studio_projects';

// Helper to read from localStorage
const readProjects = (): Project[] => {
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read projects from localStorage", error);
    return [];
  }
};

// Helper to write to localStorage
const writeProjects = (projects: Project[]) => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to write projects to localStorage", error);
  }
};

export const getProjects = (): Project[] => {
  return readProjects();
};

export const getProject = (projectId: string): Project | undefined => {
    return readProjects().find(p => p.id === projectId);
}

export const addProject = (name: string): Project | null => {
  if (!name.trim()) return null;
  const projects = readProjects();
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    name,
    assets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.unshift(newProject);
  writeProjects(projects);
  return newProject;
};

export const addAssetToProject = (
  projectId: string,
  assetName: string,
  assetType: Asset['type'],
  assetContent: AssetContent
): Project | null => {
  const projects = readProjects();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex === -1) return null;

  const newAsset: Asset = {
    id: `asset_${Date.now()}`,
    name: assetName,
    type: assetType,
    content: assetContent,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  projects[projectIndex].assets.unshift(newAsset);
  projects[projectIndex].updatedAt = new Date().toISOString();
  writeProjects(projects);
  return projects[projectIndex];
};

export const updateAsset = (projectId: string, assetId: string, newContent: AssetContent): Project | null => {
    const projects = readProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return null;

    asset.content = newContent;
    asset.updatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    writeProjects(projects);
    return project;
}

export const deleteProject = (projectId: string) => {
  let projects = readProjects();
  projects = projects.filter((p) => p.id !== projectId);
  writeProjects(projects);
};

export const deleteAssetFromProject = (projectId: string, assetId: string) => {
  const projects = readProjects();
  const projectIndex = projects.findIndex((p) => p.id === projectId);
  if (projectIndex > -1) {
    projects[projectIndex].assets = projects[projectIndex].assets.filter(
      (a) => a.id !== assetId
    );
    projects[projectIndex].updatedAt = new Date().toISOString();
    writeProjects(projects);
  }
};