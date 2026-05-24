import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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

    const { ops, slugs } = buildGuestUpserts(clientId, guestsData);
    const result = await Guest.bulkWrite(ops, { ordered: false });
    const guests = await Guest.find({ clientId, slug: { $in: slugs } }).sort({ createdAt: -1 });

    res.status(201).json({
      message: `${result.upsertedCount} added, ${result.matchedCount} updated`,
      created: result.upsertedCount,
      updated: result.matchedCount,
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

// Build idempotent upsert ops keyed on (clientId, slug). Duplicate slugs within
// the SAME batch are disambiguated (ahmad-rizki, ahmad-rizki-2, ...) so two guests
// with the same name become distinct. Re-importing the same list updates instead
// of throwing a duplicate-key error.
function buildGuestUpserts(
  clientId: string,
  guestsData: Array<Record<string, any>>
): { ops: any[]; slugs: string[] } {
  // bulkWrite bypasses Mongoose schema casting, so cast clientId to ObjectId ourselves.
  const clientOid = new mongoose.Types.ObjectId(clientId);
  const seen = new Set<string>();
  const slugs: string[] = [];
  const ops = guestsData.map((g) => {
    const base = (g.slug && String(g.slug).trim()) || slugify(g.name) || 'guest';
    let candidate = base;
    let n = 2;
    while (seen.has(candidate)) candidate = `${base}-${n++}`;
    seen.add(candidate);
    slugs.push(candidate);
    return {
      updateOne: {
        filter: { clientId: clientOid, slug: candidate },
        // $set is intentionally limited to bulkGuestSchema fields (name, invitationName,
        // slug, phone, email, category) so re-import never overwrites rsvpStatus / invitedAt.
        update: { $set: { ...g, slug: candidate, clientId: clientOid } },
        upsert: true,
      },
    };
  });
  return { ops, slugs };
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
    const { ops, slugs } = buildGuestUpserts(clientId, validated);
    const result = await Guest.bulkWrite(ops, { ordered: false });
    const guests = await Guest.find({ clientId, slug: { $in: slugs } }).sort({ createdAt: -1 });

    res.status(201).json({
      message: `${result.upsertedCount} imported, ${result.matchedCount} updated`,
      created: result.upsertedCount,
      updated: result.matchedCount,
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

export const markInvited = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invited = req.body?.invited === true;
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { invitedAt: invited ? new Date() : null },
      { new: true }
    );
    if (!guest) {
      res.status(404).json({ message: 'Guest not found' });
      return;
    }
    res.json({ guest });
  } catch (error) {
    next(error);
  }
};
