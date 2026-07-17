import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';
import AuditLog from '../models/AuditLog';
import Settings from '../models/Settings';
import { AppError } from '../app';

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 1. Basic counts
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalProducts = await Product.countDocuments();
    
    // 2. Compute total revenue
    const paidOrders = await Order.find({ paymentStatus: 'paid' });
    const totalRevenue = paidOrders.reduce((acc, order) => acc + order.grandTotal, 0);

    // 3. Recent 5 orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // 4. Sales graph data (aggregate last 7 days)
    const salesGraph = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayOrders = await Order.find({
        createdAt: { $gte: d, $lt: nextD },
        paymentStatus: 'paid'
      });

      const dayRevenue = dayOrders.reduce((acc, order) => acc + order.grandTotal, 0);
      salesGraph.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: dayRevenue,
        count: dayOrders.length
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        recentOrders,
        salesGraph
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployees = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const employees = await User.find({ role: { $in: ['admin', 'employee'] } })
      .select('-password');
    res.status(200).json({
      status: 'success',
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployeeRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['admin', 'employee', 'customer'].includes(role)) {
      return next(new AppError('Invalid role type', 400));
    }

    const employee = await User.findById(req.params.id);
    if (!employee) {
      return next(new AppError('Employee account not found', 404));
    }

    employee.role = role;
    await employee.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'EMPLOYEE_ROLE_UPDATE',
      details: `Updated employee ${employee.name} role to ${role}`
    });

    res.status(200).json({
      status: 'success',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemSettings = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await Settings.find();
    res.status(200).json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

export const updateSystemSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { settingsArray } = req.body; // Expects array of { key, value }
    if (!Array.isArray(settingsArray)) {
      return next(new AppError('Settings payload must be an array of key-value pairs', 400));
    }

    for (const item of settingsArray) {
      await Settings.findOneAndUpdate(
        { key: item.key },
        { value: item.value },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      status: 'success',
      message: 'System settings saved successfully'
    });
  } catch (error) {
    next(error);
  }
};
