import type { ObjectId } from "mongodb";

export type TitleType = "movie" | "series";

export interface Episode {
  episodeNumber: number;
  name: string;
  overview: string;
  runtimeMinutes: number;
  airDate: string | null;
  still: string | null;
  videoUrl: string;
}

export interface Season {
  number: number;
  name: string;
  episodes: Episode[];
}

export interface TitleDoc {
  _id?: ObjectId;
  tmdbId: number;
  slug: string;
  name: string;
  type: TitleType;
  overview: string;
  year: number;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  runtimeMinutes: number;
  cast: string[];
  poster: string;
  backdrop: string;
  videoUrl: string;
  maturity: string;
  featured: boolean;
  trending: boolean;
  newRelease: boolean;
  kidsFriendly: boolean;
  seasons?: Season[];
  createdAt: Date;
}

export interface TitleDTO {
  id: string;
  tmdbId: number;
  slug: string;
  name: string;
  type: TitleType;
  overview: string;
  year: number;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  runtimeMinutes: number;
  cast: string[];
  poster: string;
  backdrop: string;
  videoUrl: string;
  maturity: string;
  seasonCount: number;
  episodeCount: number;
  featured: boolean;
  trending: boolean;
  newRelease: boolean;
  kidsFriendly: boolean;
  seasons?: Season[];
}

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface ProfileDoc {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  avatar: number;
  isKids: boolean;
  createdAt: Date;
}

export interface ProfileDTO {
  id: string;
  name: string;
  avatar: number;
  isKids: boolean;
}

export interface MyListItemDoc {
  _id?: ObjectId;
  profileId: ObjectId;
  titleId: ObjectId;
  createdAt: Date;
}

export interface ProgressDoc {
  _id?: ObjectId;
  profileId: ObjectId;
  titleId: ObjectId;
  episodeId: string | null;
  position: number;
  duration: number;
  updatedAt: Date;
}

export interface RatingDoc {
  _id?: ObjectId;
  profileId: ObjectId;
  titleId: ObjectId;
  value: 1 | -1;
  updatedAt: Date;
}

export interface SessionPayload {
  userId: string;
  email: string;
}

export interface ProfileSessionPayload {
  profileId: string;
  userId: string;
}

export interface ProgressDTO {
  titleId: string;
  episodeId: string | null;
  position: number;
  duration: number;
  updatedAt: string;
}

export interface ContinueWatchingItem {
  title: TitleDTO;
  progress: ProgressDTO;
  episodeLabel: string | null;
}

export interface BrowseRow {
  key: string;
  title: string;
  items: TitleDTO[];
  href?: string;
  ranked?: boolean;
}

export interface RowItem {
  title: TitleDTO;
  progress?: { position: number; duration: number };
  episodeId?: string | null;
  episodeLabel?: string | null;
}
