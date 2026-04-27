import { Request, Response, NextFunction } from 'express';
import { Client, Guest, Wish } from '../models';

// Public - get invitation data by client slug
export const getInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const client = await Client.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('templateId');
    if (!client) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    const wishes = await Wish.find({
      clientId: client._id,
      isApproved: true,
    }).sort({ createdAt: -1 });

    res.json({ invitation: client, wishes });
  } catch (error) {
    next(error);
  }
};

// Public - get invitation with guest personalization
export const getInvitationForGuest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug, guestSlug } = req.params;

    const client = await Client.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('templateId');
    if (!client) {
      res.status(404).json({ message: 'Invitation not found' });
      return;
    }

    const guest = await Guest.findOne({
      clientId: client._id,
      slug: guestSlug,
    });

    const wishes = await Wish.find({
      clientId: client._id,
      isApproved: true,
    }).sort({ createdAt: -1 });

    res.json({ invitation: client, guest: guest || null, wishes });
  } catch (error) {
    next(error);
  }
};
