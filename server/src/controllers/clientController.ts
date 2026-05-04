import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Client, Guest, Wish, Gift, Template } from '../models';
import { createClientSchema, updateClientSchema } from '../validators/client';
import { AuthRequest } from '../middleware/auth';
import { extractVideoId, fetchOEmbed } from '../services/youtubeService';

interface MusicInput {
  videoId?: string;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
  url?: string;
  autoplay?: boolean;
  youtubeUrl?: string;
}

async function enrichMusic(music: MusicInput | undefined): Promise<MusicInput | undefined> {
  if (!music) return music;

  const { youtubeUrl, ...rest } = music;

  if (youtubeUrl !== undefined) {
    const trimmed = (youtubeUrl || '').trim();
    if (trimmed === '') {
      // Empty youtubeUrl means "clear YouTube fields"
      return {
        ...rest,
        videoId: '',
        title: '',
        artist: '',
        thumbnailUrl: '',
      };
    }
    const videoId = extractVideoId(trimmed);
    if (!videoId) {
      const err: Error & { status?: number } = new Error('Invalid YouTube URL');
      err.status = 400;
      throw err;
    }
    try {
      const meta = await fetchOEmbed(videoId);
      return {
        ...rest,
        videoId,
        title: meta.title,
        artist: meta.artist,
        thumbnailUrl: meta.thumbnailUrl,
        url: '', // clear legacy when switching to YouTube
      };
    } catch {
      const err: Error & { status?: number } = new Error(
        'Video tidak tersedia (private/deleted/region-locked)'
      );
      err.status = 400;
      throw err;
    }
  }

  // No youtubeUrl provided — pass through as-is.
  // If admin sent music.url (legacy mode), clear YouTube-specific fields.
  if (rest.url !== undefined && rest.url !== '') {
    return {
      ...rest,
      videoId: '',
      title: '',
      artist: '',
      thumbnailUrl: '',
    };
  }

  return rest;
}

export const getClients = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clients = await Client.find({ userId: req.user?._id })
      .populate('templateId', 'name slug config')
      .sort({ createdAt: -1 });
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

function buildDefaultSections(
  defaultSections: { componentId: string; style: string; order: number }[],
  clientData: {
    groomName: string;
    brideName: string;
    eventDate: string;
    events?: any[];
    bankAccounts?: any[];
    groomParents?: { father?: string; mother?: string };
    brideParents?: { father?: string; mother?: string };
  }
): { id: string; componentId: string; data: Record<string, any>; style: string; order: number }[] {
  return defaultSections.map((s) => {
    const id = new mongoose.Types.ObjectId().toString();
    let data: Record<string, any> = {};

    switch (s.componentId) {
      case 'couple-profile':
        data = {
          groomName: clientData.groomName || '',
          brideName: clientData.brideName || '',
          groomPhoto: '',
          bridePhoto: '',
          groomParents: clientData.groomParents || { father: '', mother: '' },
          brideParents: clientData.brideParents || { father: '', mother: '' },
        };
        break;
      case 'event-detail':
        data = {
          events: clientData.events?.length
            ? clientData.events
            : [
                { name: 'Akad Nikah', date: clientData.eventDate, time: '08:00', venue: '', address: '', mapUrl: '' },
                { name: 'Resepsi', date: clientData.eventDate, time: '11:00', venue: '', address: '', mapUrl: '' },
              ],
        };
        break;
      case 'countdown':
        data = { eventDate: clientData.eventDate || '' };
        break;
      case 'donation':
        data = { bankAccounts: clientData.bankAccounts || [] };
        break;
      case 'gallery':
        data = { images: [], layout: 'carousel' };
        break;
      case 'story':
        data = { stories: [], layout: 'vertical' };
        break;
      case 'location-map':
        data = { venue: '', address: '', mapUrl: '' };
        break;
      default:
        data = {};
    }

    return { id, componentId: s.componentId, data, style: s.style, order: s.order };
  });
}

export const createClient = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = createClientSchema.parse(req.body);
    const enrichedMusic = await enrichMusic(data.music);

    let sections = data.sections || [];

    // Auto-initialize sections from template if templateId provided and no sections specified
    if (data.templateId && sections.length === 0) {
      const template = await Template.findById(data.templateId);
      if (template && template.defaultSections.length > 0) {
        sections = buildDefaultSections(template.defaultSections, data);
      }
    }

    const client = await Client.create({
      ...data,
      music: enrichedMusic,
      sections,
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
    const enrichedMusic = await enrichMusic(data.music);
    const payload = { ...data, music: enrichedMusic };
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?._id },
      payload,
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

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const clients = await Client.find({ userId: req.user?._id }, '_id');
    const clientIds = clients.map((c) => c._id);

    const [totalGuests, totalWishes, totalGifts] = await Promise.all([
      Guest.countDocuments({ clientId: { $in: clientIds } }),
      Wish.countDocuments({ clientId: { $in: clientIds } }),
      Gift.countDocuments({ clientId: { $in: clientIds } }),
    ]);

    res.json({
      stats: {
        totalClients: clients.length,
        totalGuests,
        totalWishes,
        totalGifts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientStats = async (
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

    const [rsvpStats, categoryStats, attendeeSum] = await Promise.all([
      Guest.aggregate([
        { $match: { clientId: client._id } },
        {
          $group: {
            _id: '$rsvpStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Guest.aggregate([
        { $match: { clientId: client._id } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Guest.aggregate([
        { $match: { clientId: client._id, rsvpStatus: 'attending' } },
        {
          $group: {
            _id: null,
            total: { $sum: '$numberOfGuests' },
          },
        },
      ]),
    ]);

    const totalGuests = rsvpStats.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
    const rsvpMap: Record<string, number> = {};
    rsvpStats.forEach((s: { _id: string; count: number }) => {
      rsvpMap[s._id] = s.count;
    });

    res.json({
      stats: {
        totalGuests,
        totalAttending: rsvpMap['attending'] || 0,
        totalNotAttending: rsvpMap['notAttending'] || 0,
        totalPending: rsvpMap['pending'] || 0,
        totalAttendees: attendeeSum[0]?.total || 0,
        views: client.views || 0,
        byCategory: categoryStats.map((s: { _id: string; count: number }) => ({
          category: s._id || 'other',
          count: s.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
