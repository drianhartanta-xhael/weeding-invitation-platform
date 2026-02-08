import { Request, Response, NextFunction } from 'express';
import { Wish } from '../models';
import { createWishSchema } from '../validators/wish';
import { AuthRequest } from '../middleware/auth';

export const getWishes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId } = req.params;
    const wishes = await Wish.find({ clientId }).sort({ createdAt: -1 });
    res.json({ wishes });
  } catch (error) {
    next(error);
  }
};

// Public - for invitation page
export const getPublicWishes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId } = req.params;
    const wishes = await Wish.find({ clientId, isApproved: true }).sort({
      createdAt: -1,
    });
    res.json({ wishes });
  } catch (error) {
    next(error);
  }
};

// Public - for invitation page
export const createWish = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createWishSchema.parse(req.body);
    const wish = await Wish.create(data);
    res.status(201).json({ message: 'Wish created', wish });
  } catch (error) {
    next(error);
  }
};

export const approveWish = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const wish = await Wish.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    );
    if (!wish) {
      res.status(404).json({ message: 'Wish not found' });
      return;
    }
    res.json({ message: 'Wish updated', wish });
  } catch (error) {
    next(error);
  }
};

export const deleteWish = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const wish = await Wish.findByIdAndDelete(req.params.id);
    if (!wish) {
      res.status(404).json({ message: 'Wish not found' });
      return;
    }
    res.json({ message: 'Wish deleted' });
  } catch (error) {
    next(error);
  }
};
