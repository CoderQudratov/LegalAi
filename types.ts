import React from 'react';

export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  attachment?: Attachment;
  isError?: boolean;
  groundingSources?: GroundingSource[];
}

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  icon: React.ReactNode;
}