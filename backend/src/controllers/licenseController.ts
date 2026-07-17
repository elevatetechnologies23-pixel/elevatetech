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

export const deactivateMacAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { macAddress } = req.body;
    const licenseId = req.params.id;

    if (!macAddress) {
      return next(new AppError('MAC address is required to deactivate', 400));
    }

    const license = await License.findOne({ _id: licenseId, assignedTo: req.user?._id });
    if (!license) {
      return next(new AppError('License not found or access denied', 404));
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
