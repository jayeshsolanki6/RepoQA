export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Repository {
  id: string;
  userId: string;
  owner: string;
  name: string;
  githubUrl: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  repositoryId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ChatResult {
  answer: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ProgressEvent {
  id: number;
  step: string;
  message: string;
}
