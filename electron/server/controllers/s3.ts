import { Request, Response } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

class S3Controller {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async downloadImage(req: Request, res: Response) {
    try {
      const { s3_key } = req.body;
      
      if (!s3_key) {
        return res.status(400).json({ error: 's3_key is required' });
      }

      const bucketName = process.env.AWS_S3_BUCKET || 'usuals-ai-bucket';
      
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3_key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return res.status(404).json({ error: 'Image not found' });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      // Set appropriate headers for image
      res.setHeader('Content-Type', response.ContentType || 'image/png');
      res.setHeader('Content-Length', response.ContentLength || buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Send the image buffer
      res.send(buffer);
      
    } catch (error) {
      console.error('Error downloading image from S3:', error);
      res.status(500).json({ error: 'Failed to download image from S3' });
    }
  }

  async downloadVideo(req: Request, res: Response) {
    try {
      const { s3_key } = req.body;
      
      if (!s3_key) {
        return res.status(400).json({ error: 's3_key is required' });
      }

      const bucketName = process.env.AWS_S3_BUCKET || 'usuals-ai-bucket';
      
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: s3_key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      // Set appropriate headers for video
      res.setHeader('Content-Type', response.ContentType || 'video/mp4');
      res.setHeader('Content-Length', response.ContentLength || buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      // Send the video buffer
      res.send(buffer);
      
    } catch (error) {
      console.error('Error downloading video from S3:', error);
      res.status(500).json({ error: 'Failed to download video from S3' });
    }
  }
}

const s3Controller = new S3Controller();

export const httpS3 = {
  downloadImage: (req: Request, res: Response) => s3Controller.downloadImage(req, res),
  downloadVideo: (req: Request, res: Response) => s3Controller.downloadVideo(req, res),
}; 