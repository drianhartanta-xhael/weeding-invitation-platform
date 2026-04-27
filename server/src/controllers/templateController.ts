import { Request, Response, NextFunction } from 'express';
import { Template } from '../models';
import { createTemplateSchema, updateTemplateSchema } from '../validators/template';

export const getTemplates = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const templates = await Template.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createTemplateSchema.parse(req.body);
    const template = await Template.create(data);
    res.status(201).json({ template });
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = updateTemplateSchema.parse(req.body);
    const template = await Template.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!template) {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    res.json({ template });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) {
      res.status(404).json({ message: 'Template not found' });
      return;
    }
    res.json({ message: 'Template deleted' });
  } catch (error) {
    next(error);
  }
};
