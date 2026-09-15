export interface ElectronAPI {
  isElectron: boolean;
  showNativeNotification: (title: string, body: string) => Promise<boolean>;
  toggleAlwaysOnTop: () => Promise<boolean>;
  getAlwaysOnTop: () => Promise<boolean>;
  showWaterOverlay: () => Promise<boolean>;
  closeWaterOverlay: () => Promise<boolean>;
  logWaterFromOverlay: (count: number) => Promise<boolean>;
  onSyncWaterCount: (callback: (count: number) => void) => () => void;
  saveLocalBackup: (jsonString: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  readLocalBackup: () => Promise<{ success: boolean; data?: string; error?: string; message?: string }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
