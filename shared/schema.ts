import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  primaryKey,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  photos: many(photos),
  galleries: many(galleries),
  userOrganizations: many(userOrganizations),
  photoRatings: many(photoRatings),
}));

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  userOrganizations: many(userOrganizations),
  competitions: many(competitions),
}));

// User Organizations join table (with role)
export const userOrganizations = pgTable(
  "user_organizations",
  {
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    isAdmin: boolean("is_admin").default(false),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.organizationId] }),
  })
);

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organizationId],
    references: [organizations.id],
  }),
}));

// Photos table
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  isPublic: boolean("is_public").default(true),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  galleryId: integer("gallery_id").references(() => galleries.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  viewCount: integer("view_count").default(0),
});

export const photosRelations = relations(photos, ({ one, many }) => ({
  user: one(users, {
    fields: [photos.userId],
    references: [users.id],
  }),
  gallery: one(galleries, {
    fields: [photos.galleryId],
    references: [galleries.id],
  }),
  photoRatings: many(photoRatings),
  competitionPhotos: many(competitionPhotos),
}));

// Galleries table
export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  coverPhotoId: integer("cover_photo_id"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
});

export const galleriesRelations = relations(galleries, ({ one, many }) => ({
  user: one(users, {
    fields: [galleries.userId],
    references: [users.id],
  }),
  photos: many(photos),
}));

// Competitions table
export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [competitions.organizationId],
    references: [organizations.id],
  }),
  competitionPhotos: many(competitionPhotos),
}));

// Competition Photos join table
export const competitionPhotos = pgTable(
  "competition_photos",
  {
    competitionId: integer("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    photoId: integer("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.competitionId, t.photoId] }),
  })
);

export const competitionPhotosRelations = relations(competitionPhotos, ({ one }) => ({
  competition: one(competitions, {
    fields: [competitionPhotos.competitionId],
    references: [competitions.id],
  }),
  photo: one(photos, {
    fields: [competitionPhotos.photoId],
    references: [photos.id],
  }),
}));

// Photo Ratings table
export const photoRatings = pgTable(
  "photo_ratings",
  {
    photoId: integer("photo_id")
      .notNull()
      .references(() => photos.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: real("rating").notNull(),
    isCompetitionRating: boolean("is_competition_rating").default(false),
    competitionId: integer("competition_id").references(() => competitions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.photoId, t.userId, t.isCompetitionRating] }),
  })
);

export const photoRatingsRelations = relations(photoRatings, ({ one }) => ({
  photo: one(photos, {
    fields: [photoRatings.photoId],
    references: [photos.id],
  }),
  user: one(users, {
    fields: [photoRatings.userId],
    references: [users.id],
  }),
  competition: one(competitions, {
    fields: [photoRatings.competitionId],
    references: [competitions.id],
  }),
}));

// Insert Schemas
export const upsertUserSchema = createInsertSchema(users);
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertUserOrganizationSchema = createInsertSchema(userOrganizations);
export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});
export const insertGallerySchema = createInsertSchema(galleries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
});
export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCompetitionPhotoSchema = createInsertSchema(competitionPhotos);
export const insertPhotoRatingSchema = createInsertSchema(photoRatings).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUserOrganization = z.infer<typeof insertUserOrganizationSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Gallery = typeof galleries.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type CompetitionPhoto = typeof competitionPhotos.$inferSelect;
export type InsertCompetitionPhoto = z.infer<typeof insertCompetitionPhotoSchema>;
export type PhotoRating = typeof photoRatings.$inferSelect;
export type InsertPhotoRating = z.infer<typeof insertPhotoRatingSchema>;
