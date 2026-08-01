import type { Request, Response, NextFunction } from 'express';
import Video from '../models/Video';
import AuditLog from '../models/AuditLog';
import { AppError } from '../app';

// Get active public videos
export const getPublicVideos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const videos = await Video.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: videos.length,
      data: videos
    });
  } catch (err) {
    next(err);
  }
};

// Get all videos for admin management
export const getAdminVideos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const videos = await Video.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: videos.length,
      data: videos
    });
  } catch (err) {
    next(err);
  }
};

// Create a video
export const createVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, videoUrl, thumbnailUrl, category, isFeatured, isActive, order } = req.body;

    if (!title || !videoUrl) {
      return next(new AppError('Video title and video URL are required.', 400));
    }

    const video = await Video.create({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category: category || 'Product Demo',
      isFeatured: isFeatured ?? false,
      isActive: isActive ?? true,
      order: order || 1
    });

    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        action: 'VIDEO_CREATE',
        details: `Created video entry "${title}" (${video._id})`,
        ipAddress: req.ip
      });
    }

    res.status(201).json({
      status: 'success',
      data: video
    });
  } catch (err) {
    next(err);
  }
};

// Update a video
export const updateVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!video) {
      return next(new AppError('Video entry not found.', 404));
    }

    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        action: 'VIDEO_UPDATE',
        details: `Updated video entry "${video.title}" (${video._id})`,
        ipAddress: req.ip
      });
    }

    res.status(200).json({
      status: 'success',
      data: video
    });
  } catch (err) {
    next(err);
  }
};

// Delete a video
export const deleteVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return next(new AppError('Video entry not found.', 404));
    }

    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        action: 'VIDEO_DELETE',
        details: `Deleted video entry "${video.title}" (${id})`,
        ipAddress: req.ip
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Video deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
