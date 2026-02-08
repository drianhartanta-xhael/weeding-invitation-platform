import { Response, NextFunction } from 'express';
import { Client } from '../models';
import { createClientSchema, updateClientSchema } from '../validators/client';
import { AuthRequest } from '../middleware/auth';

export const getClients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clients = await Client.find({ userId: req.user?._id }).sort({ createdAt: -1 });
    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

export const getClientBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const client = await Client.findOne({ slug: req.params.slug });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createClientSchema.parse(req.body);
    const client = await Client.create({
      ...data,
      userId: req.user?._id,
    });
    res.status(201).json({ message: 'Client created', client });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = updateClientSchema.parse(req.body);
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      data,
      { new: true }
    );
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json({ message: 'Client updated', client });
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?._id,
    });
    if (!client) {
      res.status(404).json({ message: 'Client not found' });
      return;
    }
    res.json({ message: 'Client deleted' });
  } catch (error) {
    next(error);
  }
};
