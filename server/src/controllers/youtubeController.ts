import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { extractVideoId, fetchOEmbed } from '../services/youtubeService';

const previewSchema = z.object({
  url: z.string().min(1, 'url is required'),
});

export const previewYoutube = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = previewSchema.parse(req.body);
    const videoId = extractVideoId(url);
    if (!videoId) {
      res.status(400).json({ message: 'Invalid YouTube URL' });
      return;
    }
    try {
      const meta = await fetchOEmbed(videoId);
      res.json({
        videoId,
        title: meta.title,
        artist: meta.artist,
        thumbnailUrl: meta.thumbnailUrl,
      });
    } catch {
      res
        .status(400)
        .json({ message: 'Video tidak tersedia (private/deleted/region-locked)' });
    }
  } catch (error) {
    next(error);
  }
};
