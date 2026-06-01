import type { FillMode } from '../store/types';

export type RootStackParamList = {
  Gallery: undefined;
  Canvas: {
    projectId?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    fillMode?: FillMode;
    backgroundColor?: string;
  };
};
