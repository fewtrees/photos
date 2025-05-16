import {
  users,
  type User,
  type UpsertUser,
  organizations,
  type Organization,
  type InsertOrganization,
  userOrganizations,
  type UserOrganization,
  type InsertUserOrganization,
  photos,
  type Photo,
  type InsertPhoto,
  galleries,
  type Gallery,
  type InsertGallery,
  competitions,
  type Competition,
  type InsertCompetition,
  competitionPhotos,
  type CompetitionPhoto,
  type InsertCompetitionPhoto,
  photoRatings,
  type PhotoRating,
  type InsertPhotoRating,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, isNull, sql, inArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUsername(id: string, username: string): Promise<User | undefined>;
  updateUserBio(id: string, bio: string): Promise<User | undefined>;
  
  // Organization operations
  createOrganization(data: InsertOrganization, userId: string): Promise<Organization>;
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizations(): Promise<Organization[]>;
  getOrganizationsByUser(userId: string): Promise<Organization[]>;
  updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;
  
  // User Organization operations
  addUserToOrganization(data: InsertUserOrganization): Promise<UserOrganization>;
  removeUserFromOrganization(userId: string, organizationId: number): Promise<boolean>;
  getUserOrganization(userId: string, organizationId: number): Promise<UserOrganization | undefined>;
  getOrganizationUsers(organizationId: number): Promise<(UserOrganization & { user: User })[]>;
  getOrganizationAdmins(organizationId: number): Promise<(UserOrganization & { user: User })[]>;
  isUserOrganizationAdmin(userId: string, organizationId: number): Promise<boolean>;
  
  // Photo operations
  createPhoto(data: InsertPhoto): Promise<Photo>;
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByUser(userId: string): Promise<Photo[]>;
  getPhotosByGallery(galleryId: number): Promise<Photo[]>;
  getRecentPhotos(limit?: number): Promise<(Photo & { user: User })[]>;
  updatePhoto(id: number, data: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number): Promise<boolean>;
  incrementPhotoViews(id: number): Promise<void>;
  
  // Gallery operations
  createGallery(data: InsertGallery): Promise<Gallery>;
  getGallery(id: number): Promise<Gallery | undefined>;
  getGalleriesByUser(userId: string): Promise<Gallery[]>;
  updateGallery(id: number, data: Partial<InsertGallery>): Promise<Gallery | undefined>;
  deleteGallery(id: number): Promise<boolean>;
  incrementGalleryViews(id: number): Promise<void>;
  incrementGalleryLikes(id: number): Promise<void>;
  
  // Competition operations
  createCompetition(data: InsertCompetition): Promise<Competition>;
  getCompetition(id: number): Promise<Competition | undefined>;
  getCompetitionsByOrganization(organizationId: number): Promise<Competition[]>;
  getActiveCompetitions(): Promise<Competition[]>;
  updateCompetition(id: number, data: Partial<InsertCompetition>): Promise<Competition | undefined>;
  deleteCompetition(id: number): Promise<boolean>;
  
  // Competition Photo operations
  addPhotoToCompetition(data: InsertCompetitionPhoto): Promise<CompetitionPhoto>;
  removePhotoFromCompetition(competitionId: number, photoId: number): Promise<boolean>;
  getCompetitionPhotos(competitionId: number): Promise<(CompetitionPhoto & { photo: Photo })[]>;
  isPhotoInCompetition(photoId: number, competitionId: number): Promise<boolean>;
  
  // Rating operations
  ratePhoto(data: InsertPhotoRating): Promise<PhotoRating>;
  getPhotoRating(photoId: number, userId: string, isCompetitionRating: boolean): Promise<PhotoRating | undefined>;
  getPhotoRatings(photoId: number): Promise<PhotoRating[]>;
  getPhotoAverageRating(photoId: number): Promise<number | null>;
  getCompetitionPhotoRatings(photoId: number, competitionId: number): Promise<PhotoRating[]>;
  getCompetitionPhotoAverageRating(photoId: number, competitionId: number): Promise<number | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUsername(id: string, username: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ username, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserBio(id: string, bio: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ bio, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(data: InsertOrganization, userId: string): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(data).returning();
    
    // Add creator as admin
    await db.insert(userOrganizations).values({
      userId,
      organizationId: organization.id,
      isAdmin: true,
    });
    
    return organization;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }

  async getOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations).orderBy(organizations.name);
  }

  async getOrganizationsByUser(userId: string): Promise<Organization[]> {
    const result = await db
      .select({
        organization: organizations,
      })
      .from(userOrganizations)
      .innerJoin(organizations, eq(organizations.id, userOrganizations.organizationId))
      .where(eq(userOrganizations.userId, userId))
      .orderBy(organizations.name);
    
    return result.map(r => r.organization);
  }

  async updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [organization] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return organization;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    const result = await db.delete(organizations).where(eq(organizations.id, id));
    return result.rowCount > 0;
  }

  // User Organization operations
  async addUserToOrganization(data: InsertUserOrganization): Promise<UserOrganization> {
    const [userOrg] = await db
      .insert(userOrganizations)
      .values(data)
      .onConflictDoUpdate({
        target: [userOrganizations.userId, userOrganizations.organizationId],
        set: data,
      })
      .returning();
    return userOrg;
  }

  async removeUserFromOrganization(userId: string, organizationId: number): Promise<boolean> {
    const result = await db
      .delete(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId)
        )
      );
    return result.rowCount > 0;
  }

  async getUserOrganization(userId: string, organizationId: number): Promise<UserOrganization | undefined> {
    const [userOrg] = await db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId)
        )
      );
    return userOrg;
  }

  async getOrganizationUsers(organizationId: number): Promise<(UserOrganization & { user: User })[]> {
    return db
      .select()
      .from(userOrganizations)
      .innerJoin(users, eq(users.id, userOrganizations.userId))
      .where(eq(userOrganizations.organizationId, organizationId))
      .orderBy(users.username);
  }

  async getOrganizationAdmins(organizationId: number): Promise<(UserOrganization & { user: User })[]> {
    return db
      .select()
      .from(userOrganizations)
      .innerJoin(users, eq(users.id, userOrganizations.userId))
      .where(
        and(
          eq(userOrganizations.organizationId, organizationId),
          eq(userOrganizations.isAdmin, true)
        )
      )
      .orderBy(users.username);
  }

  async isUserOrganizationAdmin(userId: string, organizationId: number): Promise<boolean> {
    const [userOrg] = await db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId),
          eq(userOrganizations.isAdmin, true)
        )
      );
    return !!userOrg;
  }

  // Photo operations
  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(data).returning();
    return photo;
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotosByUser(userId: string): Promise<Photo[]> {
    return db
      .select()
      .from(photos)
      .where(eq(photos.userId, userId))
      .orderBy(desc(photos.createdAt));
  }

  async getPhotosByGallery(galleryId: number): Promise<Photo[]> {
    return db
      .select()
      .from(photos)
      .where(eq(photos.galleryId, galleryId))
      .orderBy(desc(photos.createdAt));
  }

  async getRecentPhotos(limit: number = 20): Promise<(Photo & { user: User })[]> {
    return db
      .select()
      .from(photos)
      .innerJoin(users, eq(users.id, photos.userId))
      .where(eq(photos.isPublic, true))
      .orderBy(desc(photos.createdAt))
      .limit(limit);
  }

  async updatePhoto(id: number, data: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const [photo] = await db
      .update(photos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(photos.id, id))
      .returning();
    return photo;
  }

  async deletePhoto(id: number): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return result.rowCount > 0;
  }

  async incrementPhotoViews(id: number): Promise<void> {
    await db
      .update(photos)
      .set({ viewCount: sql`${photos.viewCount} + 1` })
      .where(eq(photos.id, id));
  }

  // Gallery operations
  async createGallery(data: InsertGallery): Promise<Gallery> {
    const [gallery] = await db.insert(galleries).values(data).returning();
    return gallery;
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    const [gallery] = await db.select().from(galleries).where(eq(galleries.id, id));
    return gallery;
  }

  async getGalleriesByUser(userId: string): Promise<Gallery[]> {
    return db
      .select()
      .from(galleries)
      .where(eq(galleries.userId, userId))
      .orderBy(desc(galleries.createdAt));
  }

  async updateGallery(id: number, data: Partial<InsertGallery>): Promise<Gallery | undefined> {
    const [gallery] = await db
      .update(galleries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(galleries.id, id))
      .returning();
    return gallery;
  }

  async deleteGallery(id: number): Promise<boolean> {
    const result = await db.delete(galleries).where(eq(galleries.id, id));
    return result.rowCount > 0;
  }

  async incrementGalleryViews(id: number): Promise<void> {
    await db
      .update(galleries)
      .set({ viewCount: sql`${galleries.viewCount} + 1` })
      .where(eq(galleries.id, id));
  }

  async incrementGalleryLikes(id: number): Promise<void> {
    await db
      .update(galleries)
      .set({ likeCount: sql`${galleries.likeCount} + 1` })
      .where(eq(galleries.id, id));
  }

  // Competition operations
  async createCompetition(data: InsertCompetition): Promise<Competition> {
    const [competition] = await db.insert(competitions).values(data).returning();
    return competition;
  }

  async getCompetition(id: number): Promise<Competition | undefined> {
    const [competition] = await db.select().from(competitions).where(eq(competitions.id, id));
    return competition;
  }

  async getCompetitionsByOrganization(organizationId: number): Promise<Competition[]> {
    return db
      .select()
      .from(competitions)
      .where(eq(competitions.organizationId, organizationId))
      .orderBy(desc(competitions.createdAt));
  }

  async getActiveCompetitions(): Promise<Competition[]> {
    return db
      .select()
      .from(competitions)
      .where(eq(competitions.isActive, true))
      .orderBy(desc(competitions.createdAt));
  }

  async updateCompetition(id: number, data: Partial<InsertCompetition>): Promise<Competition | undefined> {
    const [competition] = await db
      .update(competitions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(competitions.id, id))
      .returning();
    return competition;
  }

  async deleteCompetition(id: number): Promise<boolean> {
    const result = await db.delete(competitions).where(eq(competitions.id, id));
    return result.rowCount > 0;
  }

  // Competition Photo operations
  async addPhotoToCompetition(data: InsertCompetitionPhoto): Promise<CompetitionPhoto> {
    const [compPhoto] = await db
      .insert(competitionPhotos)
      .values(data)
      .onConflictDoUpdate({
        target: [competitionPhotos.competitionId, competitionPhotos.photoId],
        set: data,
      })
      .returning();
    return compPhoto;
  }

  async removePhotoFromCompetition(competitionId: number, photoId: number): Promise<boolean> {
    const result = await db
      .delete(competitionPhotos)
      .where(
        and(
          eq(competitionPhotos.competitionId, competitionId),
          eq(competitionPhotos.photoId, photoId)
        )
      );
    return result.rowCount > 0;
  }

  async getCompetitionPhotos(competitionId: number): Promise<(CompetitionPhoto & { photo: Photo })[]> {
    return db
      .select()
      .from(competitionPhotos)
      .innerJoin(photos, eq(photos.id, competitionPhotos.photoId))
      .where(eq(competitionPhotos.competitionId, competitionId))
      .orderBy(desc(competitionPhotos.submittedAt));
  }

  async isPhotoInCompetition(photoId: number, competitionId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(competitionPhotos)
      .where(
        and(
          eq(competitionPhotos.photoId, photoId),
          eq(competitionPhotos.competitionId, competitionId)
        )
      );
    return !!result;
  }

  // Rating operations
  async ratePhoto(data: InsertPhotoRating): Promise<PhotoRating> {
    const [rating] = await db
      .insert(photoRatings)
      .values(data)
      .onConflictDoUpdate({
        target: [
          photoRatings.photoId, 
          photoRatings.userId, 
          photoRatings.isCompetitionRating
        ],
        set: {
          ...data,
          updatedAt: new Date(),
        },
      })
      .returning();
    return rating;
  }

  async getPhotoRating(
    photoId: number, 
    userId: string, 
    isCompetitionRating: boolean
  ): Promise<PhotoRating | undefined> {
    const [rating] = await db
      .select()
      .from(photoRatings)
      .where(
        and(
          eq(photoRatings.photoId, photoId),
          eq(photoRatings.userId, userId),
          eq(photoRatings.isCompetitionRating, isCompetitionRating)
        )
      );
    return rating;
  }

  async getPhotoRatings(photoId: number): Promise<PhotoRating[]> {
    return db
      .select()
      .from(photoRatings)
      .where(
        and(
          eq(photoRatings.photoId, photoId),
          eq(photoRatings.isCompetitionRating, false)
        )
      );
  }

  async getPhotoAverageRating(photoId: number): Promise<number | null> {
    const [result] = await db
      .select({
        avgRating: sql`AVG(${photoRatings.rating})`.as("avg_rating"),
      })
      .from(photoRatings)
      .where(
        and(
          eq(photoRatings.photoId, photoId),
          eq(photoRatings.isCompetitionRating, false)
        )
      );
    
    return result?.avgRating;
  }

  async getCompetitionPhotoRatings(photoId: number, competitionId: number): Promise<PhotoRating[]> {
    return db
      .select()
      .from(photoRatings)
      .where(
        and(
          eq(photoRatings.photoId, photoId),
          eq(photoRatings.competitionId, competitionId),
          eq(photoRatings.isCompetitionRating, true)
        )
      );
  }

  async getCompetitionPhotoAverageRating(photoId: number, competitionId: number): Promise<number | null> {
    const [result] = await db
      .select({
        avgRating: sql`AVG(${photoRatings.rating})`.as("avg_rating"),
      })
      .from(photoRatings)
      .where(
        and(
          eq(photoRatings.photoId, photoId),
          eq(photoRatings.competitionId, competitionId),
          eq(photoRatings.isCompetitionRating, true)
        )
      );
    
    return result?.avgRating;
  }
}

// Memory storage implementation for development
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private organizations: Map<number, Organization> = new Map();
  private userOrganizations: (UserOrganization)[] = [];
  private photos: Map<number, Photo> = new Map();
  private galleries: Map<number, Gallery> = new Map();
  private competitions: Map<number, Competition> = new Map();
  private competitionPhotos: (CompetitionPhoto)[] = [];
  private photoRatings: (PhotoRating)[] = [];
  
  private lastOrgId = 0;
  private lastPhotoId = 0;
  private lastGalleryId = 0;
  private lastCompetitionId = 0;

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const user: User = {
      ...userData,
      createdAt: this.users.has(userData.id) ? this.users.get(userData.id)!.createdAt : now,
      updatedAt: now,
    };
    this.users.set(userData.id, user);
    return user;
  }

  async updateUsername(id: string, username: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, username, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserBio(id: string, bio: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, bio, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Organization operations
  async createOrganization(data: InsertOrganization, userId: string): Promise<Organization> {
    const id = ++this.lastOrgId;
    const now = new Date();
    const organization: Organization = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.organizations.set(id, organization);
    
    // Add creator as admin
    this.userOrganizations.push({
      userId,
      organizationId: id,
      isAdmin: true,
      joinedAt: new Date(),
    });
    
    return organization;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getOrganizationsByUser(userId: string): Promise<Organization[]> {
    const userOrgIds = this.userOrganizations
      .filter(uo => uo.userId === userId)
      .map(uo => uo.organizationId);
    
    return Array.from(this.organizations.values())
      .filter(org => userOrgIds.includes(org.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateOrganization(id: number, data: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const organization = this.organizations.get(id);
    if (!organization) return undefined;
    
    const updatedOrg = { 
      ...organization,
      ...data,
      updatedAt: new Date()
    };
    
    this.organizations.set(id, updatedOrg);
    return updatedOrg;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    if (!this.organizations.has(id)) return false;
    
    this.organizations.delete(id);
    // Clean up related records
    this.userOrganizations = this.userOrganizations.filter(uo => uo.organizationId !== id);
    return true;
  }

  // User Organization operations
  async addUserToOrganization(data: InsertUserOrganization): Promise<UserOrganization> {
    // Remove if exists
    this.userOrganizations = this.userOrganizations.filter(
      uo => !(uo.userId === data.userId && uo.organizationId === data.organizationId)
    );
    // Add new
    this.userOrganizations.push(data);
    return data;
  }

  async removeUserFromOrganization(userId: string, organizationId: number): Promise<boolean> {
    const initialLength = this.userOrganizations.length;
    this.userOrganizations = this.userOrganizations.filter(
      uo => !(uo.userId === userId && uo.organizationId === organizationId)
    );
    return initialLength > this.userOrganizations.length;
  }

  async getUserOrganization(userId: string, organizationId: number): Promise<UserOrganization | undefined> {
    return this.userOrganizations.find(
      uo => uo.userId === userId && uo.organizationId === organizationId
    );
  }

  async getOrganizationUsers(organizationId: number): Promise<(UserOrganization & { user: User })[]> {
    return this.userOrganizations
      .filter(uo => uo.organizationId === organizationId)
      .map(uo => {
        const user = this.users.get(uo.userId);
        if (!user) return null;
        return { ...uo, user };
      })
      .filter((item): item is (UserOrganization & { user: User }) => item !== null)
      .sort((a, b) => (a.user.username || '').localeCompare(b.user.username || ''));
  }

  async getOrganizationAdmins(organizationId: number): Promise<(UserOrganization & { user: User })[]> {
    return this.userOrganizations
      .filter(uo => uo.organizationId === organizationId && uo.isAdmin)
      .map(uo => {
        const user = this.users.get(uo.userId);
        if (!user) return null;
        return { ...uo, user };
      })
      .filter((item): item is (UserOrganization & { user: User }) => item !== null)
      .sort((a, b) => (a.user.username || '').localeCompare(b.user.username || ''));
  }

  async isUserOrganizationAdmin(userId: string, organizationId: number): Promise<boolean> {
    const userOrg = this.userOrganizations.find(
      uo => uo.userId === userId && uo.organizationId === organizationId && uo.isAdmin
    );
    return !!userOrg;
  }

  // Photo operations
  async createPhoto(data: InsertPhoto): Promise<Photo> {
    const id = ++this.lastPhotoId;
    const now = new Date();
    const photo: Photo = {
      ...data,
      id,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    this.photos.set(id, photo);
    return photo;
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByUser(userId: string): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPhotosByGallery(galleryId: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.galleryId === galleryId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentPhotos(limit: number = 20): Promise<(Photo & { user: User })[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.isPublic)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map(photo => {
        const user = this.users.get(photo.userId);
        if (!user) return null;
        return { ...photo, user };
      })
      .filter((item): item is (Photo & { user: User }) => item !== null);
  }

  async updatePhoto(id: number, data: Partial<InsertPhoto>): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto = { 
      ...photo,
      ...data,
      updatedAt: new Date()
    };
    
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<boolean> {
    if (!this.photos.has(id)) return false;
    
    this.photos.delete(id);
    // Clean up related records
    this.competitionPhotos = this.competitionPhotos.filter(cp => cp.photoId !== id);
    this.photoRatings = this.photoRatings.filter(pr => pr.photoId !== id);
    return true;
  }

  async incrementPhotoViews(id: number): Promise<void> {
    const photo = this.photos.get(id);
    if (photo) {
      photo.viewCount = (photo.viewCount || 0) + 1;
      this.photos.set(id, photo);
    }
  }

  // Gallery operations
  async createGallery(data: InsertGallery): Promise<Gallery> {
    const id = ++this.lastGalleryId;
    const now = new Date();
    const gallery: Gallery = {
      ...data,
      id,
      viewCount: 0,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    this.galleries.set(id, gallery);
    return gallery;
  }

  async getGallery(id: number): Promise<Gallery | undefined> {
    return this.galleries.get(id);
  }

  async getGalleriesByUser(userId: string): Promise<Gallery[]> {
    return Array.from(this.galleries.values())
      .filter(gallery => gallery.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateGallery(id: number, data: Partial<InsertGallery>): Promise<Gallery | undefined> {
    const gallery = this.galleries.get(id);
    if (!gallery) return undefined;
    
    const updatedGallery = { 
      ...gallery,
      ...data,
      updatedAt: new Date()
    };
    
    this.galleries.set(id, updatedGallery);
    return updatedGallery;
  }

  async deleteGallery(id: number): Promise<boolean> {
    if (!this.galleries.has(id)) return false;
    
    this.galleries.delete(id);
    // Update photos to remove gallery association
    for (const [photoId, photo] of this.photos.entries()) {
      if (photo.galleryId === id) {
        const updatedPhoto = { ...photo, galleryId: null };
        this.photos.set(photoId, updatedPhoto);
      }
    }
    return true;
  }

  async incrementGalleryViews(id: number): Promise<void> {
    const gallery = this.galleries.get(id);
    if (gallery) {
      gallery.viewCount = (gallery.viewCount || 0) + 1;
      this.galleries.set(id, gallery);
    }
  }

  async incrementGalleryLikes(id: number): Promise<void> {
    const gallery = this.galleries.get(id);
    if (gallery) {
      gallery.likeCount = (gallery.likeCount || 0) + 1;
      this.galleries.set(id, gallery);
    }
  }

  // Competition operations
  async createCompetition(data: InsertCompetition): Promise<Competition> {
    const id = ++this.lastCompetitionId;
    const now = new Date();
    const competition: Competition = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.competitions.set(id, competition);
    return competition;
  }

  async getCompetition(id: number): Promise<Competition | undefined> {
    return this.competitions.get(id);
  }

  async getCompetitionsByOrganization(organizationId: number): Promise<Competition[]> {
    return Array.from(this.competitions.values())
      .filter(comp => comp.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getActiveCompetitions(): Promise<Competition[]> {
    return Array.from(this.competitions.values())
      .filter(comp => comp.isActive)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateCompetition(id: number, data: Partial<InsertCompetition>): Promise<Competition | undefined> {
    const competition = this.competitions.get(id);
    if (!competition) return undefined;
    
    const updatedCompetition = { 
      ...competition,
      ...data,
      updatedAt: new Date()
    };
    
    this.competitions.set(id, updatedCompetition);
    return updatedCompetition;
  }

  async deleteCompetition(id: number): Promise<boolean> {
    if (!this.competitions.has(id)) return false;
    
    this.competitions.delete(id);
    // Clean up related records
    this.competitionPhotos = this.competitionPhotos.filter(cp => cp.competitionId !== id);
    return true;
  }

  // Competition Photo operations
  async addPhotoToCompetition(data: InsertCompetitionPhoto): Promise<CompetitionPhoto> {
    // Remove if exists
    this.competitionPhotos = this.competitionPhotos.filter(
      cp => !(cp.photoId === data.photoId && cp.competitionId === data.competitionId)
    );
    
    const submittedAt = data.submittedAt || new Date();
    const compPhoto = { ...data, submittedAt };
    this.competitionPhotos.push(compPhoto);
    return compPhoto;
  }

  async removePhotoFromCompetition(competitionId: number, photoId: number): Promise<boolean> {
    const initialLength = this.competitionPhotos.length;
    this.competitionPhotos = this.competitionPhotos.filter(
      cp => !(cp.photoId === photoId && cp.competitionId === competitionId)
    );
    return initialLength > this.competitionPhotos.length;
  }

  async getCompetitionPhotos(competitionId: number): Promise<(CompetitionPhoto & { photo: Photo })[]> {
    return this.competitionPhotos
      .filter(cp => cp.competitionId === competitionId)
      .map(cp => {
        const photo = this.photos.get(cp.photoId);
        if (!photo) return null;
        return { ...cp, photo };
      })
      .filter((item): item is (CompetitionPhoto & { photo: Photo }) => item !== null)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async isPhotoInCompetition(photoId: number, competitionId: number): Promise<boolean> {
    const entry = this.competitionPhotos.find(
      cp => cp.photoId === photoId && cp.competitionId === competitionId
    );
    return !!entry;
  }

  // Rating operations
  async ratePhoto(data: InsertPhotoRating): Promise<PhotoRating> {
    // Remove if exists
    this.photoRatings = this.photoRatings.filter(
      pr => !(
        pr.photoId === data.photoId && 
        pr.userId === data.userId && 
        pr.isCompetitionRating === data.isCompetitionRating &&
        pr.competitionId === data.competitionId
      )
    );
    
    const now = new Date();
    const rating: PhotoRating = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    
    this.photoRatings.push(rating);
    return rating;
  }

  async getPhotoRating(
    photoId: number, 
    userId: string, 
    isCompetitionRating: boolean
  ): Promise<PhotoRating | undefined> {
    return this.photoRatings.find(
      pr => 
        pr.photoId === photoId && 
        pr.userId === userId && 
        pr.isCompetitionRating === isCompetitionRating
    );
  }

  async getPhotoRatings(photoId: number): Promise<PhotoRating[]> {
    return this.photoRatings
      .filter(pr => pr.photoId === photoId && !pr.isCompetitionRating);
  }

  async getPhotoAverageRating(photoId: number): Promise<number | null> {
    const ratings = this.photoRatings
      .filter(pr => pr.photoId === photoId && !pr.isCompetitionRating)
      .map(pr => pr.rating);
    
    if (ratings.length === 0) return null;
    
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
  }

  async getCompetitionPhotoRatings(photoId: number, competitionId: number): Promise<PhotoRating[]> {
    return this.photoRatings
      .filter(pr => 
        pr.photoId === photoId && 
        pr.isCompetitionRating && 
        pr.competitionId === competitionId
      );
  }

  async getCompetitionPhotoAverageRating(photoId: number, competitionId: number): Promise<number | null> {
    const ratings = this.photoRatings
      .filter(pr => 
        pr.photoId === photoId && 
        pr.isCompetitionRating && 
        pr.competitionId === competitionId
      )
      .map(pr => pr.rating);
    
    if (ratings.length === 0) return null;
    
    const sum = ratings.reduce((acc, rating) => acc + rating, 0);
    return sum / ratings.length;
  }
}

// Use in-memory storage for development if no database is configured
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
