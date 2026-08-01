import { Request, Response, NextFunction } from 'express';
import License from '../models/License';
import AuditLog from '../models/AuditLog';
import { AppError } from '../app';

export const validateLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { licenseKey, macAddress } = req.body;

    if (!licenseKey || !macAddress) {
      return next(new AppError('License key and MAC address are required', 400));
    }

    const license = await License.findOne({ licenseKey });
    if (!license) {
      return next(new AppError('Invalid license key', 404));
    }

    if (license.status !== 'active') {
      return next(new AppError(`License is currently ${license.status}`, 403));
    }

    const now = new Date();
    if (now > license.validUntil) {
      license.status = 'expired';
      await license.save();
      return next(new AppError('License key has expired', 403));
    }

    // Check MAC address activation
    const alreadyRegistered = license.macAddresses.includes(macAddress);
    if (!alreadyRegistered) {
      if (license.activeActivations >= license.maxActivations) {
        return next(new AppError('Maximum activations limit reached', 403));
      }
      license.macAddresses.push(macAddress);
      license.activeActivations += 1;
      await license.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'License activated successfully',
      data: {
        productName: license.productName,
        validUntil: license.validUntil,
        activeActivations: license.activeActivations,
        maxActivations: license.maxActivations
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMyLicenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const licenses = await License.find({ assignedTo: req.user?._id }).sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: licenses
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminLicenses = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const licenses = await License.find().populate('assignedTo', 'name email').sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      data: licenses
    });
  } catch (error) {
    next(error);
  }
};

export const updateLicenseStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, maxActivations } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) {
      return next(new AppError('License not found', 404));
    }

    if (status) license.status = status;
    if (maxActivations !== undefined) license.maxActivations = maxActivations;
    await license.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'LICENSE_STATUS_UPDATE',
      details: `Updated license ${license.licenseKey} to status: ${status || license.status}`
    });

    res.status(200).json({
      status: 'success',
      data: license
    });
  } catch (error) {
    next(error);
  }
};

export const createLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productName, assignedTo, maxActivations, validUntil, status } = req.body;
    
    // Auto generate key: LIC-XXXX-XXXX-XXXX-XXXX
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const licenseKey = `LIC-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}`;

    const license = await License.create({
      licenseKey,
      productName: productName || 'Enterprise Billing & POS Software',
      assignedTo: assignedTo || req.user?._id,
      maxActivations: Number(maxActivations) || 3,
      activeActivations: 0,
      macAddresses: [],
      status: status || 'active',
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });

    await AuditLog.create({
      user: req.user?._id,
      action: 'LICENSE_CREATE',
      details: `Created license key ${license.licenseKey} for ${license.productName}`
    });

    res.status(201).json({
      status: 'success',
      data: license
    });
  } catch (error) {
    next(error);
  }
};

export const updateLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productName, maxActivations, validUntil, status, assignedTo } = req.body;
    const license = await License.findById(req.params.id);
    if (!license) {
      return next(new AppError('License not found', 404));
    }

    if (productName) license.productName = productName;
    if (maxActivations !== undefined) license.maxActivations = maxActivations;
    if (validUntil) license.validUntil = new Date(validUntil);
    if (status) license.status = status;
    if (assignedTo) license.assignedTo = assignedTo;

    await license.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'LICENSE_UPDATE',
      details: `Updated license ${license.licenseKey}`
    });

    res.status(200).json({
      status: 'success',
      data: license
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLicense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const license = await License.findByIdAndDelete(req.params.id);
    if (!license) {
      return next(new AppError('License not found', 404));
    }

    await AuditLog.create({
      user: req.user?._id,
      action: 'LICENSE_DELETE',
      details: `Deleted license ${license.licenseKey}`
    });

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateMacAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { macAddress } = req.body;
    const licenseId = req.params.id;

    if (!macAddress) {
      return next(new AppError('MAC address is required to deactivate', 400));
    }

    const license = await License.findOne({ _id: licenseId });
    if (!license) {
      return next(new AppError('License not found', 404));
    }

    const index = license.macAddresses.indexOf(macAddress);
    if (index === -1) {
      return next(new AppError('MAC address is not bound to this license', 404));
    }

    // Remove the MAC address
    license.macAddresses.splice(index, 1);
    license.activeActivations = Math.max(0, license.activeActivations - 1);
    await license.save();

    await AuditLog.create({
      user: req.user?._id,
      action: 'LICENSE_MAC_DEACTIVATE',
      details: `Deactivated MAC address ${macAddress} from license ${license.licenseKey}`
    });

    res.status(200).json({
      status: 'success',
      message: 'MAC address released successfully',
      data: license
    });
  } catch (error) {
    next(error);
  }
};

