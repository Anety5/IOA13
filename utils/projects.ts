// These types are based on the state managed in their respective views.
// We'll define them here to be used for storing assets.

export type OptimizerAction = 'optimize' | 'summarize' | 'modify' | 'proofread';

export interface OptimizerResult {
  type: OptimizerAction;
  content: string;
  prompt?: string;
}

export interface OptimizerState {
  originalText: string;
  attachments: { data: string; mimeType: string }[];
  results: OptimizerResult[];
  creativity: number;
  complexity: number;
  formality: 'Formal' | 'Neutral' | 'Casual';
  tone: 'Professional' | 'Friendly' | 'Direct' | 'Narrative';
  guardrails: {
    proofread: boolean;
    plagiarismCheck: boolean;
  };
}

export interface ImageViewState {
  mode: 'generate' | 'edit' | 'analyze';
  prompt: string;
  sourceImage: { data: string; mimeType: string } | null;
  images: { src: string; prompt: string }[];
  isGenerating: boolean;
  error: string | null;
  analysisResult: string | null;
  numberOfImages: number;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style: 'none' | 'photorealistic' | 'anime' | '3d' | 'monochrome' | 'abstract';
}

export interface TranslatorState {
    fromText: string;
    toText: string;
    fromLang: string;
    toLang: string;
    isLoading: boolean;
    error: string | null;
}

// FIX: Add types for Project Studio view state and results.
export interface ProjectStudioResult {
  type: 'summarize' | 'modify';
  content: string;
  prompt?: string;
}

export interface ProjectStudioViewState {
  mainText: string;
  attachments: { data: string; mimeType: string }[];
  results: ProjectStudioResult[];
}

// AssetContent is a union of all possible state types that can be saved.
// FIX: Add ProjectStudioViewState to AssetContent union type.
export type AssetContent = OptimizerState | ImageViewState | TranslatorState | ProjectStudioViewState;

export interface Asset {
  id: string;
  name: string;
  // FIX: Add 'project_studio' to Asset type.
  type: 'optimizer' | 'image' | 'translator' | 'project_studio';
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

// Utility to get projects from localStorage
export const getProjects = (): Project[] => {
  try {
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    if (projectsJson) {
      return JSON.parse(projectsJson);
    }
  } catch (error) {
    console.error("Failed to parse projects from localStorage", error);
  }
  return [];
};

// Utility to save projects to localStorage
const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage", error);
  }
};

// Add a new project
export const addProject = (name: string): Project | null => {
  if (!name.trim()) return null;
  const projects = getProjects();
  const newProject: Project = {
    id: `proj_${Date.now()}`,
    name,
    assets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.unshift(newProject);
  saveProjects(projects);
  return newProject;
};

// Delete a project
export const deleteProject = (projectId: string): void => {
  let projects = getProjects();
  projects = projects.filter(p => p.id !== projectId);
  saveProjects(projects);
};

// Add an asset to a project
export const addAssetToProject = (
  projectId: string,
  assetName: string,
  assetType: Asset['type'],
  assetContent: AssetContent
): Project | null => {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);
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
  
  saveProjects(projects);
  return projects[projectIndex];
};


// Delete an asset from a project
export const deleteAssetFromProject = (projectId: string, assetId: string): void => {
  const projects = getProjects();
  const projectIndex = projects.findIndex(p => p.id === projectId);
  if (projectIndex > -1) {
    projects[projectIndex].assets = projects[projectIndex].assets.filter(a => a.id !== assetId);
    projects[projectIndex].updatedAt = new Date().toISOString();
    saveProjects(projects);
  }
};

// Add a single asset without a project (for "Save as New Asset")
export const addOrphanAsset = (assetName: string, assetType: Asset['type'], assetContent: AssetContent) => {
    const projects = getProjects();
    const orphanProjectName = "My Assets";
    let project = projects.find(p => p.name === orphanProjectName);

    if (!project) {
        project = addProject(orphanProjectName);
    }
    
    if (project) {
        addAssetToProject(project.id, assetName, assetType, assetContent);
    }
};
