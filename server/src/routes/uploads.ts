import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import { r2Configured, uploadBuffer } from '../lib/r2';

const router = Router();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

router.post(
  '/',
  authenticate,
  upload.array('images', 20),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ message: 'No files uploaded' });
        return;
      }

      if (!r2Configured) {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
      }

      const urls = await Promise.all(
        files.map(async (file) => {
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;

          const webp = await sharp(file.buffer)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();

          if (r2Configured) {
            return await uploadBuffer(`uploads/${filename}`, webp, 'image/webp');
          }

          const dest = path.join(UPLOAD_DIR, filename);
          await fs.writeFile(dest, webp);
          return `/uploads/${filename}`;
        })
      );

      res.json({ urls });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
