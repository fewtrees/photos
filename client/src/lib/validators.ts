import { z } from "zod";

export const photoValidator = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL"),
  isPublic: z.boolean().default(true),
  galleryId: z.number().optional(),
});

export const galleryValidator = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
  coverPhotoId: z.number().optional(),
});

export const organizationValidator = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const competitionValidator = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: z.date().default(() => new Date()),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
});

export const photoRatingValidator = z.object({
  rating: z.number().min(0).max(5),
  isCompetitionRating: z.boolean().default(false),
  competitionId: z.number().optional(),
});

export const usernameValidator = z.object({
  username: z.string().min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
});

export const bioValidator = z.object({
  bio: z.string().max(200, "Bio must be at most 200 characters"),
});
