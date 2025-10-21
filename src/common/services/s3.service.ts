import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('VITE_AWS_REGION');
    const accessKeyId = this.configService.get<string>(
      'VITE_AWS_ACCESS_KEY_ID',
    );
    const secretAccessKey = this.configService.get<string>(
      'VITE_AWS_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>(
      'VITE_AWS_S3_BUCKET_NAME',
    );

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(`S3 Service initialized with bucket: ${this.bucketName}`);
  }

  /**
   * Sube un archivo a S3
   * @param file - Archivo de Express Multer
   * @param folder - Carpeta dentro del bucket (ej: 'rooms', 'videos')
   * @returns URL pública del archivo subido
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'rooms',
  ): Promise<string> {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${folder}-${timestamp}-${randomString}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
      this.logger.log(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Sube múltiples archivos a S3
   * @param files - Array de archivos de Express Multer
   * @param folder - Carpeta dentro del bucket
   * @returns Array de URLs públicas de los archivos subidos
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder: string = 'rooms',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Elimina un archivo de S3 usando su URL completa
   * @param fileUrl - URL completa del archivo (ej: https://bucket.s3.amazonaws.com/rooms/file.jpg)
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraer la key del URL
      const key = this.extractKeyFromUrl(fileUrl);
      if (!key) {
        this.logger.warn(`Could not extract key from URL: ${fileUrl}`);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Elimina múltiples archivos de S3
   * @param fileUrls - Array de URLs completas de archivos
   */
  async deleteFiles(fileUrls: string[]): Promise<void> {
    if (!fileUrls || fileUrls.length === 0) {
      return;
    }

    try {
      // Extraer keys de las URLs
      const keys = fileUrls
        .map((url) => this.extractKeyFromUrl(url))
        .filter((key) => key !== null);

      if (keys.length === 0) {
        this.logger.warn('No valid keys to delete');
        return;
      }

      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      });

      await this.s3Client.send(command);
      this.logger.log(`${keys.length} files deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting files from S3: ${error.message}`);
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  }

  /**
   * Extrae la key (ruta) de un URL de S3
   * @param url - URL completa del archivo
   * @returns Key del archivo o null si no se puede extraer
   */
  private extractKeyFromUrl(url: string): string | null {
    try {
      // Formato esperado: https://bucket.s3.amazonaws.com/folder/file.ext
      // o https://bucket.s3.region.amazonaws.com/folder/file.ext
      const urlObj = new URL(url);
      // Remover el "/" inicial del pathname
      return urlObj.pathname.substring(1);
    } catch (error) {
      this.logger.error(`Invalid URL format: ${url}`);
      return null;
    }
  }
}
