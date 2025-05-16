import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPhotoSchema, 
  insertGallerySchema, 
  insertOrganizationSchema, 
  insertCompetitionSchema,
  insertPhotoRatingSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.post('/api/users/username', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { username } = req.body;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.updateUsername(userId, username);
      res.json(user);
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Failed to update username" });
    }
  });

  app.post('/api/users/bio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bio } = req.body;
      
      if (!bio || typeof bio !== 'string') {
        return res.status(400).json({ message: "Bio is required" });
      }
      
      const user = await storage.updateUserBio(userId, bio);
      res.json(user);
    } catch (error) {
      console.error("Error updating bio:", error);
      res.status(500).json({ message: "Failed to update bio" });
    }
  });

  // Photos API
  app.post('/api/photos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertPhotoSchema.safeParse({ ...req.body, userId });
      
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const photo = await storage.createPhoto(result.data);
      res.status(201).json(photo);
    } catch (error) {
      console.error("Error creating photo:", error);
      res.status(500).json({ message: "Failed to create photo" });
    }
  });

  app.get('/api/photos', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const photos = await storage.getRecentPhotos(limit);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  app.get('/api/photos/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const photos = await storage.getPhotosByUser(userId);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching user photos:", error);
      res.status(500).json({ message: "Failed to fetch user photos" });
    }
  });

  app.get('/api/photos/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Increment view count
      await storage.incrementPhotoViews(id);
      
      res.json(photo);
    } catch (error) {
      console.error("Error fetching photo:", error);
      res.status(500).json({ message: "Failed to fetch photo" });
    }
  });

  app.put('/api/photos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Check permissions
      if (photo.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized to update this photo" });
      }
      
      const result = insertPhotoSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const updatedPhoto = await storage.updatePhoto(id, result.data);
      res.json(updatedPhoto);
    } catch (error) {
      console.error("Error updating photo:", error);
      res.status(500).json({ message: "Failed to update photo" });
    }
  });

  app.delete('/api/photos/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      const photo = await storage.getPhoto(id);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Check permissions
      if (photo.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized to delete this photo" });
      }
      
      await storage.deletePhoto(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  // Galleries API
  app.post('/api/galleries', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertGallerySchema.safeParse({ ...req.body, userId });
      
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const gallery = await storage.createGallery(result.data);
      res.status(201).json(gallery);
    } catch (error) {
      console.error("Error creating gallery:", error);
      res.status(500).json({ message: "Failed to create gallery" });
    }
  });

  app.get('/api/galleries/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const galleries = await storage.getGalleriesByUser(userId);
      res.json(galleries);
    } catch (error) {
      console.error("Error fetching user galleries:", error);
      res.status(500).json({ message: "Failed to fetch user galleries" });
    }
  });

  app.get('/api/galleries/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery ID" });
      }
      
      const gallery = await storage.getGallery(id);
      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }
      
      // Increment view count
      await storage.incrementGalleryViews(id);
      
      res.json(gallery);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.get('/api/galleries/:id/photos', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery ID" });
      }
      
      const gallery = await storage.getGallery(id);
      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }
      
      const photos = await storage.getPhotosByGallery(id);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching gallery photos:", error);
      res.status(500).json({ message: "Failed to fetch gallery photos" });
    }
  });

  app.put('/api/galleries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery ID" });
      }
      
      const gallery = await storage.getGallery(id);
      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }
      
      // Check permissions
      if (gallery.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized to update this gallery" });
      }
      
      const result = insertGallerySchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const updatedGallery = await storage.updateGallery(id, result.data);
      res.json(updatedGallery);
    } catch (error) {
      console.error("Error updating gallery:", error);
      res.status(500).json({ message: "Failed to update gallery" });
    }
  });

  app.delete('/api/galleries/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid gallery ID" });
      }
      
      const gallery = await storage.getGallery(id);
      if (!gallery) {
        return res.status(404).json({ message: "Gallery not found" });
      }
      
      // Check permissions
      if (gallery.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Unauthorized to delete this gallery" });
      }
      
      await storage.deleteGallery(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      res.status(500).json({ message: "Failed to delete gallery" });
    }
  });

  // Organizations API
  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = insertOrganizationSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const organization = await storage.createOrganization(result.data, userId);
      res.status(201).json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get('/api/organizations', async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.get('/api/organizations/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const organizations = await storage.getOrganizationsByUser(userId);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching user organizations:", error);
      res.status(500).json({ message: "Failed to fetch user organizations" });
    }
  });

  app.get('/api/organizations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  app.get('/api/organizations/:id/users', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const users = await storage.getOrganizationUsers(id);
      res.json(users);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ message: "Failed to fetch organization users" });
    }
  });

  app.get('/api/organizations/:id/admins', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const admins = await storage.getOrganizationAdmins(id);
      res.json(admins);
    } catch (error) {
      console.error("Error fetching organization admins:", error);
      res.status(500).json({ message: "Failed to fetch organization admins" });
    }
  });

  app.post('/api/organizations/:id/users', isAuthenticated, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const { userId, isAdmin } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(req.user.claims.sub, organizationId);
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to add users to this organization" });
      }
      
      const userOrg = await storage.addUserToOrganization({
        userId,
        organizationId,
        isAdmin: !!isAdmin,
      });
      
      res.status(201).json(userOrg);
    } catch (error) {
      console.error("Error adding user to organization:", error);
      res.status(500).json({ message: "Failed to add user to organization" });
    }
  });

  app.delete('/api/organizations/:orgId/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.orgId);
      const userId = req.params.userId;
      
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(req.user.claims.sub, organizationId);
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to remove users from this organization" });
      }
      
      // Cannot remove yourself if you're the only admin
      if (userId === req.user.claims.sub) {
        const admins = await storage.getOrganizationAdmins(organizationId);
        if (admins.filter(admin => admin.isAdmin).length <= 1) {
          return res.status(400).json({ message: "Cannot remove the only admin from the organization" });
        }
      }
      
      await storage.removeUserFromOrganization(userId, organizationId);
      res.status(204).end();
    } catch (error) {
      console.error("Error removing user from organization:", error);
      res.status(500).json({ message: "Failed to remove user from organization" });
    }
  });

  app.put('/api/organizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(req.user.claims.sub, id);
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to update this organization" });
      }
      
      const result = insertOrganizationSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const updatedOrganization = await storage.updateOrganization(id, result.data);
      res.json(updatedOrganization);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.delete('/api/organizations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(req.user.claims.sub, id);
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to delete this organization" });
      }
      
      await storage.deleteOrganization(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // Competitions API
  app.post('/api/organizations/:orgId/competitions', isAuthenticated, async (req: any, res) => {
    try {
      const organizationId = parseInt(req.params.orgId);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(req.user.claims.sub, organizationId);
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to create competitions for this organization" });
      }
      
      const result = insertCompetitionSchema.safeParse({ 
        ...req.body, 
        organizationId 
      });
      
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const competition = await storage.createCompetition(result.data);
      res.status(201).json(competition);
    } catch (error) {
      console.error("Error creating competition:", error);
      res.status(500).json({ message: "Failed to create competition" });
    }
  });

  app.get('/api/competitions', async (req, res) => {
    try {
      const competitions = await storage.getActiveCompetitions();
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching competitions:", error);
      res.status(500).json({ message: "Failed to fetch competitions" });
    }
  });

  app.get('/api/organizations/:orgId/competitions', async (req, res) => {
    try {
      const organizationId = parseInt(req.params.orgId);
      if (isNaN(organizationId)) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      const competitions = await storage.getCompetitionsByOrganization(organizationId);
      res.json(competitions);
    } catch (error) {
      console.error("Error fetching organization competitions:", error);
      res.status(500).json({ message: "Failed to fetch organization competitions" });
    }
  });

  app.get('/api/competitions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      const competition = await storage.getCompetition(id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      res.json(competition);
    } catch (error) {
      console.error("Error fetching competition:", error);
      res.status(500).json({ message: "Failed to fetch competition" });
    }
  });

  app.put('/api/competitions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      const competition = await storage.getCompetition(id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(
        req.user.claims.sub, 
        competition.organizationId
      );
      
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to update this competition" });
      }
      
      const result = insertCompetitionSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      const updatedCompetition = await storage.updateCompetition(id, result.data);
      res.json(updatedCompetition);
    } catch (error) {
      console.error("Error updating competition:", error);
      res.status(500).json({ message: "Failed to update competition" });
    }
  });

  app.delete('/api/competitions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      const competition = await storage.getCompetition(id);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Check if the current user is an admin of the organization
      const isUserAdmin = await storage.isUserOrganizationAdmin(
        req.user.claims.sub, 
        competition.organizationId
      );
      
      if (!isUserAdmin) {
        return res.status(403).json({ message: "Unauthorized to delete this competition" });
      }
      
      await storage.deleteCompetition(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting competition:", error);
      res.status(500).json({ message: "Failed to delete competition" });
    }
  });

  // Competition Photos API
  app.post('/api/competitions/:id/photos', isAuthenticated, async (req: any, res) => {
    try {
      const competitionId = parseInt(req.params.id);
      if (isNaN(competitionId)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      const { photoId } = req.body;
      if (!photoId) {
        return res.status(400).json({ message: "Photo ID is required" });
      }
      
      // Check if the competition exists and is active
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      if (!competition.isActive) {
        return res.status(400).json({ message: "This competition is no longer active" });
      }
      
      // Check if the photo exists and belongs to the current user
      const photo = await storage.getPhoto(parseInt(photoId));
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      if (photo.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "You can only submit your own photos" });
      }
      
      // Check if the user belongs to the organization
      const userOrg = await storage.getUserOrganization(req.user.claims.sub, competition.organizationId);
      if (!userOrg) {
        return res.status(403).json({ message: "You must be a member of the organization to submit photos" });
      }
      
      const competitionPhoto = await storage.addPhotoToCompetition({
        competitionId,
        photoId: parseInt(photoId),
      });
      
      res.status(201).json(competitionPhoto);
    } catch (error) {
      console.error("Error adding photo to competition:", error);
      res.status(500).json({ message: "Failed to add photo to competition" });
    }
  });

  app.get('/api/competitions/:id/photos', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid competition ID" });
      }
      
      const photos = await storage.getCompetitionPhotos(id);
      res.json(photos);
    } catch (error) {
      console.error("Error fetching competition photos:", error);
      res.status(500).json({ message: "Failed to fetch competition photos" });
    }
  });

  app.delete('/api/competitions/:compId/photos/:photoId', isAuthenticated, async (req: any, res) => {
    try {
      const competitionId = parseInt(req.params.compId);
      const photoId = parseInt(req.params.photoId);
      
      if (isNaN(competitionId) || isNaN(photoId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      
      // Check if the competition exists
      const competition = await storage.getCompetition(competitionId);
      if (!competition) {
        return res.status(404).json({ message: "Competition not found" });
      }
      
      // Check if the photo exists and belongs to the current user
      const photo = await storage.getPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // Check permissions - either the photo owner or organization admin can remove it
      const isPhotoOwner = photo.userId === req.user.claims.sub;
      const isOrgAdmin = await storage.isUserOrganizationAdmin(
        req.user.claims.sub, 
        competition.organizationId
      );
      
      if (!isPhotoOwner && !isOrgAdmin) {
        return res.status(403).json({ 
          message: "Unauthorized to remove this photo from the competition" 
        });
      }
      
      await storage.removePhotoFromCompetition(competitionId, photoId);
      res.status(204).end();
    } catch (error) {
      console.error("Error removing photo from competition:", error);
      res.status(500).json({ message: "Failed to remove photo from competition" });
    }
  });

  // Photo Ratings API
  app.post('/api/photos/:id/rate', isAuthenticated, async (req: any, res) => {
    try {
      const photoId = parseInt(req.params.id);
      if (isNaN(photoId)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      const userId = req.user.claims.sub;
      const result = insertPhotoRatingSchema.safeParse({
        ...req.body,
        photoId,
        userId,
      });
      
      if (!result.success) {
        return res.status(400).json({ errors: result.error.format() });
      }
      
      // Check if the photo exists
      const photo = await storage.getPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      // If rating for a competition, check if the photo is in the competition
      if (result.data.isCompetitionRating && result.data.competitionId) {
        const isInCompetition = await storage.isPhotoInCompetition(
          photoId, 
          result.data.competitionId
        );
        
        if (!isInCompetition) {
          return res.status(400).json({ 
            message: "This photo is not part of the specified competition" 
          });
        }
        
        // Check if user is in the organization
        const competition = await storage.getCompetition(result.data.competitionId);
        if (!competition) {
          return res.status(404).json({ message: "Competition not found" });
        }
        
        const userOrg = await storage.getUserOrganization(
          userId, 
          competition.organizationId
        );
        
        if (!userOrg) {
          return res.status(403).json({ 
            message: "You must be a member of the organization to rate competition photos" 
          });
        }
      }
      
      const rating = await storage.ratePhoto(result.data);
      res.json(rating);
    } catch (error) {
      console.error("Error rating photo:", error);
      res.status(500).json({ message: "Failed to rate photo" });
    }
  });

  app.get('/api/photos/:id/ratings', async (req, res) => {
    try {
      const photoId = parseInt(req.params.id);
      if (isNaN(photoId)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      
      const ratings = await storage.getPhotoRatings(photoId);
      const avgRating = await storage.getPhotoAverageRating(photoId);
      
      res.json({ ratings, avgRating });
    } catch (error) {
      console.error("Error fetching photo ratings:", error);
      res.status(500).json({ message: "Failed to fetch photo ratings" });
    }
  });

  app.get('/api/competitions/:compId/photos/:photoId/ratings', async (req, res) => {
    try {
      const competitionId = parseInt(req.params.compId);
      const photoId = parseInt(req.params.photoId);
      
      if (isNaN(competitionId) || isNaN(photoId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      
      const ratings = await storage.getCompetitionPhotoRatings(photoId, competitionId);
      const avgRating = await storage.getCompetitionPhotoAverageRating(photoId, competitionId);
      
      res.json({ ratings, avgRating });
    } catch (error) {
      console.error("Error fetching competition photo ratings:", error);
      res.status(500).json({ message: "Failed to fetch competition photo ratings" });
    }
  });

  // Stats API for Dashboard
  app.get('/api/users/:userId/stats', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user's photos, galleries, organizations
      const photos = await storage.getPhotosByUser(userId);
      const galleries = await storage.getGalleriesByUser(userId);
      const organizations = await storage.getOrganizationsByUser(userId);
      
      // Get all competitions from user's organizations
      const competitionPromises = organizations.map(org => 
        storage.getCompetitionsByOrganization(org.id)
      );
      const competitionsByOrg = await Promise.all(competitionPromises);
      const competitions = competitionsByOrg.flat().filter(comp => comp.isActive);
      
      res.json({
        photoCount: photos.length,
        galleryCount: galleries.length,
        organizationCount: organizations.length,
        competitionCount: competitions.length
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
