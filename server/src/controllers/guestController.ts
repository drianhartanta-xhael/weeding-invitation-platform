import { Request, Response, NextFunction } from 'express';
import Papa from 'papaparse';
import { Guest } from '../models';
import { createGuestSchema, updateGuestSchema, rsvpSchema, bulkGuestSchema } from '../validators/guest';
import { AuthRequest } from '../middleware/auth';

export const getGuests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId } = req.params;
    const guests = await Guest.find({ clientId }).sort({ createdAt: -1 });
    res.json({ guests });
  } catch (error) {
    next(error);
  }
};

export const getGuestById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      res.status(404).json({ message: 'Guest not found' });
      return;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
};

export const createGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createGuestSchema.parse(req.body);
    const guest = await Guest.create(data);
    res.status(201).json({ message: 'Guest created', guest });
  } catch (error) {
    next(error);
  }
};

export const updateGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = updateGuestSchema.parse(req.body);
    const guest = await Guest.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!guest) {
      res.status(404).json({ message: 'Guest not found' });
      return;
    }
    res.json({ message: 'Guest updated', guest });
  } catch (error) {
    next(error);
  }
};

export const deleteGuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const guest = await Guest.findByIdAndDelete(req.params.id);
    if (!guest) {
      res.status(404).json({ message: 'Guest not found' });
      return;
    }
    res.json({ message: 'Guest deleted' });
  } catch (error) {
    next(error);
  }
};

export const bulkCreateGuests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId } = req.params;
    const guestsData = bulkGuestSchema.parse(req.body.guests);

    const guests = await Guest.insertMany(
      guestsData.map((g) => ({ ...g, clientId }))
    );

    res.status(201).json({
      message: `${guests.length} guests created`,
      guests,
    });
  } catch (error) {
    next(error);
  }
};

// Slugify helper
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const bulkUploadGuests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: 'CSV file is required' });
      return;
    }

    const csvText = file.buffer.toString('utf-8');
    const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim().toLowerCase(),
    });

    if (errors.length > 0) {
      res.status(400).json({ message: 'CSV parsing errors', errors });
      return;
    }

    const guestsData = data.map((row) => ({
      name: row.name?.trim() || '',
      invitationName: row.invitationname?.trim() || row.invitation_name?.trim() || row.name?.trim() || '',
      slug: row.slug?.trim() || slugify(row.name || ''),
      phone: row.phone?.trim() || '',
      email: row.email?.trim() || '',
      category: row.category?.trim() || 'other',
    }));

    const validated = bulkGuestSchema.parse(guestsData);
    const guests = await Guest.insertMany(
      validated.map((g) => ({ ...g, clientId }))
    );

    res.status(201).json({
      message: `${guests.length} guests imported`,
      guests,
    });
  } catch (error) {
    next(error);
  }
};

// Public - for invitation page RSVP
export const submitRSVP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = rsvpSchema.parse(req.body);
    const { clientSlug, guestSlug } = req.params;

    const guest = await Guest.findOne({ slug: guestSlug }).populate('clientId');
    if (!guest) {
      res.status(404).json({ message: 'Guest not found' });
      return;
    }

    guest.rsvpStatus = data.rsvpStatus;
    guest.numberOfGuests = data.numberOfGuests;
    guest.rsvpDate = new Date();
    await guest.save();

    res.json({ message: 'RSVP submitted', guest });
  } catch (error) {
    next(error);
  }
};
