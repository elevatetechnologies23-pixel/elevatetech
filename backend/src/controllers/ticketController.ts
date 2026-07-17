import { Request, Response, NextFunction } from 'express';
import SupportTicket from '../models/SupportTicket';
import { AppError } from '../app';
import { notifyAdmins } from '../utils/notifications';

export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticketNumber = 'TCK-' + Math.floor(100000 + Math.random() * 900000).toString();

    const ticket = await SupportTicket.create({
      user: req.user?._id,
      ticketNumber,
      subject,
      description,
      category,
      priority,
      status: 'open',
      messages: [{
        sender: req.user?._id,
        message: description
      }]
    });

    res.status(201).json({
      status: 'success',
      data: ticket
    });

    // Notify all admin users about the new support ticket
    await notifyAdmins(
      'New Support Ticket',
      `Ticket ${ticketNumber} opened — "${subject}" (${category}, ${priority} priority)`,
      '/admin/tickets'
    );
  } catch (error) {
    next(error);
  }
};

export const getMyTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await SupportTicket.find({ user: req.user?._id }).sort({ updatedAt: -1 });
    res.status(200).json({
      status: 'success',
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber })
      .populate('user', 'name email')
      .populate('messages.sender', 'name role');

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    if (req.user?.role === 'customer' && ticket.user._id.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized', 403));
    }

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const addTicketMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message } = req.body;
    const ticket = await SupportTicket.findOne({ ticketNumber: req.params.ticketNumber });
    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    if (req.user?.role === 'customer' && ticket.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized', 403));
    }

    ticket.messages.push({
      sender: req.user?._id as any,
      message,
      createdAt: new Date()
    });

    // Auto update status if staff replies
    if (req.user?.role === 'admin' || req.user?.role === 'employee') {
      ticket.status = 'in-progress';
    } else {
      ticket.status = 'open';
    }

    await ticket.save();

    // Notify admins when a customer sends a message (not staff themselves)
    if (req.user?.role === 'customer') {
      await notifyAdmins(
        'Customer Reply on Support Ticket',
        `Customer replied on ticket ${ticket.ticketNumber} — "${ticket.subject}"`,
        '/admin/tickets'
      );
    }

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTickets = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await SupportTicket.find().populate('user', 'name email').sort({ updatedAt: -1 });
    res.status(200).json({
      status: 'success',
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, assignedTo } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    await ticket.save();

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};
