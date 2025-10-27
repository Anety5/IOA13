import { GenerateTextOptions } from "../services/geminiService";
import { Part } from "@google/genai";

// --- TYPE DEFINITIONS ---

interface Message {
  role: 'user' | 'model';
  parts: Part[];
  groundingChunks?: any[];
}

interface Transcript {
  speaker: 'user' | 'model';
  text: string;
}

export interface OptimizerAssetContent {
  inputText: string;
  outputText: string;
  settings: {
    task: 'optimize' | 'summarize' | 'proofread';
    creativity: number;
    complexity: number;
    plagiarismGuard: boolean;
    educationLevel: 'general' | 'k12' | 'university';
  };
}

export interface ChatAssetContent {
  messages: Message[];
}

export interface ImageAssetContent {
  prompt: string;
  b64: string;
  mimeType: string;
  imageStyle: string;
}

export interface TranslatorAssetContent {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface AnalysisAssetContent {
    prompt: string;
    sourceImageB64: string;
    resultText: string;
}

export interface LiveConversationAssetContent {
    transcripts: Transcript[];
}


export type AssetContent = OptimizerAssetContent | ChatAssetContent | ImageAssetContent | TranslatorAssetContent | AnalysisAssetContent | LiveConversationAssetContent;

export interface Asset {
  id: string;
  name: string;
  type: 'optimizer' | 'chat' | 'image' | 'translator' | 'analysis' | 'liveConversation';
  createdAt: string;
  content: AssetContent;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  assets: Asset[];
}

const PROJECTS_KEY = 'ai_optimizer_projects';

// --- HELPER FUNCTIONS ---

export const getProjects = (): Project[] => {
  try {
    const saved = localStorage.getItem(PROJECTS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load projects from localStorage", e);
    return [];
  }
};

const saveProjects = (projects: Project[]): boolean => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch (e) {
    console.error("Failed to save projects to localStorage", e);
    alert("Error: Could not save projects. Your browser's storage might be full.");
    return false;
  }
};

// --- CORE API ---

export const addProject = (name: string): Project | null => {
  if (!name.trim()) return null;
  const projects = getProjects();
  const newProject: Project = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    assets: [],
  };
  const success = saveProjects([...projects, newProject]);
  return success ? newProject : null;
};

export const deleteProject = (projectId: string): Project[] => {
  let projects = getProjects();
  projects = projects.filter(p => p.id !== projectId);
  saveProjects(projects);
  return projects;
};

export const updateProjectName = (projectId: string, newName: string): Project[] => {
  if (!newName.trim()) return getProjects();
  const projects = getProjects();
  const project = projects.find(p => p.id === projectId);
  if (project) {
    project.name = newName;
    saveProjects(projects);
  }
  return projects;
}

export const addAssetToProject = (projectId: string, name: string, type: Asset['type'], content: AssetContent): Project | null => {
    if (!name.trim()) return null;
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const newAsset: Asset = {
        id: crypto.randomUUID(),
        name,
        type,
        createdAt: new Date().toISOString(),
        content,
    };

    project.assets.unshift(newAsset);
    const success = saveProjects(projects);
    return success ? project : null;
};

export const deleteAsset = (projectId: string, assetId: string): Project[] => {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if(project) {
        project.assets = project.assets.filter(a => a.id !== assetId);
        saveProjects(projects);
    }
    return projects;
};