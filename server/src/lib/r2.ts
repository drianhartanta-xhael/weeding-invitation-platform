import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// R2 is configured when all five env vars are present. Outside that, the
// uploader falls back to disk (see routes/uploads.ts) so local dev still
// works without R2 credentials.
const accountId = process.env.R2_ACCOUNT_ID || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucket = process.env.R2_BUCKET || '';
const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');

export const r2Configured =
  !!accountId && !!accessKeyId && !!secretAccessKey && !!bucket && !!publicBaseUrl;

const client = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!client) {
    throw new Error('R2 is not configured');
  }
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${publicBaseUrl}/${key}`;
}
