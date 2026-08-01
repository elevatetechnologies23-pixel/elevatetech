import { Request, Response, NextFunction } from 'express';
import Banner from '../models/Banner';
import AuditLog from '../models/AuditLog';
import { AppError } from '../app';

export const getPublicBanners = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: banners.length,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminBanners = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, subtitle, imageUrl, linkUrl, ctaText, order, isActive } = req.body;
    if (!title || !imageUrl) {
      return next(new AppError('Title and Image URL are required', 400));
    }

    const banner = await Banner.create({
      title,
      subtitle,
      imageUrl,
      linkUrl: linkUrl || '/catalog',
      ctaText: ctaText || 'Explore Catalog',
      order: order !== undefined ? Number(order) : 0,
      isActive: isActive !== undefined ? isActive : true
    });

    await AuditLog.create({
      user: req.user?._id,
      action: 'BANNER_CREATE',
      details: `Created hero banner slide "${banner.title}"`
    });

    res.status(201).json({
      status: 'success',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, subtitle, imageUrl, linkUrl, ctaText, order, isActive } = req.body;
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return next(new AppError('Banner not found', 404));
    }

    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (imageUrl !== undefined) banner.imageUrl = imageUrl;
    if (linkUrl !== undefined) banner.linkUrl = linkUrl;
    if (ctaText !== undefined) banner.ctaText = ctaText;
    if (order !== undefined) banner.order = Number(order);
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'BANNER_UPDATE',
      details: `Updated hero banner slide "${banner.title}"`
    });

    res.status(200).json({
      status: 'success',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return next(new AppError('Banner not found', 404));
    }

    await AuditLog.create({
      user: req.user?._id,
      action: 'BANNER_DELETE',
      details: `Deleted hero banner slide "${banner.title}"`
    });

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
