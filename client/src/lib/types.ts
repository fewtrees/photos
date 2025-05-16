import {
  User,
  Photo,
  Gallery,
  Organization,
  Competition,
  PhotoRating,
  CompetitionPhoto,
  UserOrganization
} from "@shared/schema";

// Extended types for the frontend
export interface PhotoWithUser extends Photo {
  user: User;
  avgRating?: number;
}

export interface GalleryWithStats extends Gallery {
  photos?: Photo[];
  coverImageUrl?: string;
}

export interface OrganizationWithStats extends Organization {
  memberCount?: number;
  isAdmin?: boolean;
  isCurrentUserMember?: boolean;
  competitions?: Competition[];
}

export interface CompetitionWithStats extends Competition {
  organization: Organization;
  photoCount?: number;
}

export interface UserStats {
  photoCount: number;
  galleryCount: number;
  organizationCount: number;
  competitionCount: number;
}

export interface RatingResponse {
  ratings: PhotoRating[];
  avgRating: number | null;
}

export interface CompetitionPhotoWithDetails extends CompetitionPhoto {
  photo: Photo;
  user: User;
  avgRating?: number;
}
