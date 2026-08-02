import { Request, Response, NextFunction } from 'express';
import DemoBooking from '../models/DemoBooking';
import AuditLog from '../models/AuditLog';
import { AppError } from '../app';
import { notifyAdmins } from '../utils/notifications';

// Public: Book a Live Demo
export const bookDemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, companyName, productInterest, preferredDate, preferredTime, notes } = req.body;

    if (!name || !email || !phone || !preferredDate || !preferredTime) {
      return next(new AppError('Name, email, phone, date, and time are required to book a demo', 400));
    }

    const demo = await DemoBooking.create({
      name,
      email,
      phone,
      companyName: companyName || '',
      productInterest: productInterest || 'POS Billing Software',
      preferredDate,
      preferredTime,
      notes: notes || '',
      status: 'pending'
    });

    await notifyAdmins(
      'New Live Demo Request',
      `Demo request submitted by ${name} (${companyName || 'Business Client'}) for ${productInterest || 'POS Billing Software'}`,
      '/admin/demos'
    );

    res.status(201).json({
      status: 'success',
      message: 'Live Demo appointment requested successfully! Our team will contact you.',
      data: demo
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all demo requests
export const getAdminDemos = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demos = await DemoBooking.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: demos.length,
      data: demos
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update demo request status & meeting link
export const updateDemoStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, meetingLink, notes } = req.body;
    const demo = await DemoBooking.findById(req.params.id);
    if (!demo) {
      return next(new AppError('Demo request not found', 404));
    }

    if (status) demo.status = status;
    if (meetingLink !== undefined) demo.meetingLink = meetingLink;
    if (notes !== undefined) demo.notes = notes;

    await demo.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'DEMO_STATUS_UPDATE',
      details: `Updated demo request for ${demo.name} to status: ${status}`
    });

    res.status(200).json({
      status: 'success',
      data: demo
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete demo request
export const deleteDemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const demo = await DemoBooking.findByIdAndDelete(req.params.id);
    if (!demo) {
      return next(new AppError('Demo request not found', 404));
    }
    res.status(200).json({
      status: 'success',
      message: 'Demo request deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
