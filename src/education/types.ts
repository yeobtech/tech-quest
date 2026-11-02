// 학습 등급과 게임 레벨은 독립적입니다. 장치 연결은 이후 어댑터로 구현합니다.
export type LearningRank = '입문' | '탐구' | '설계' | '제작';
export interface LearningProgress { rank: LearningRank; completedMissionIds: string[] }
export interface TechMission { id: string; kind: 'quiz' | 'circuit' | 'sensor' | 'motor' | 'recognition' | 'boss'; title: string; requiresTeacherApproval: boolean }
export interface DeviceGateway { connect(): Promise<void>; readSensor(name: string): Promise<number>; setMotor(power: number): Promise<void> }
