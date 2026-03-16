import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface SoundEffect {
    id: string;
    duration: bigint;
    name: string;
    audioBlob: ExternalBlob;
    category: SoundCategory;
}
export interface VideoProject {
    id: string;
    title: string;
    created: Time;
    owner: Principal;
    videoBlob: ExternalBlob;
    edits: string;
    updated: Time;
}
export interface UserProfile {
    name: string;
}
export enum SoundCategory {
    sfx = "sfx",
    transitions = "transitions",
    ambience = "ambience",
    beats = "beats"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSoundEffect(id: string, name: string, category: SoundCategory, duration: bigint, audioBlob: ExternalBlob): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(id: string, title: string, videoBlob: ExternalBlob, edits: string): Promise<void>;
    deleteProject(id: string): Promise<void>;
    getAllCategories(): Promise<Array<SoundCategory>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyProjects(): Promise<Array<VideoProject>>;
    getProjectById(id: string): Promise<VideoProject>;
    getSoundEffectsByCategory(category: SoundCategory): Promise<Array<SoundEffect>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeSoundEffect(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateProject(id: string, title: string, videoBlob: ExternalBlob, edits: string): Promise<void>;
}
