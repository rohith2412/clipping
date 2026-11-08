import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function uploadFile(
  key: string,
  filePath: string,
  contentType = "application/octet-stream"
) {
  const fileStream = createReadStream(filePath);
  const fileStat = await stat(filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
      ContentLength: fileStat.size,
    })
  );

  return { key, size: fileStat.size };
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType = "application/octet-stream"
) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return { key, size: buffer.length };
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  );
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  return getSignedUrl(
    s3Client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}

export async function deleteFile(key: string) {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
  );
}

export function getS3Key(
  projectId: string,
  ...parts: string[]
): string {
  return `projects/${projectId}/${parts.join("/")}`;
}

export { s3Client, BUCKET };
