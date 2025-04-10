export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  sound?: string;
  unlockDate?: Date;
  progress?: number;
}
