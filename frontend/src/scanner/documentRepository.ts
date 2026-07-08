import { BaseRepository } from '../repository/base.repository';
import { attachments } from '../database/schema';
import { Attachment, NewAttachment } from '../database/models';
import * as FileSystem from 'expo-file-system/legacy';
import { database } from '../database';
import { eq, and, sql } from 'drizzle-orm';

class DocumentRepository extends BaseRepository<typeof attachments, NewAttachment, Attachment> {
  constructor() {
    super(attachments, 'attachments');
  }

  /**
   * Fetch all attachments for a specific transaction
   */
  async getAttachmentsForTransaction(transactionId: string): Promise<Attachment[]> {
    const results = await database
      .select()
      .from(attachments)
      .where(
        and(
          eq(attachments.transactionId, transactionId),
          sql`${attachments.deletedAt} IS NULL`
        )
      );
    return results as unknown as Attachment[];
  }

  /**
   * Save a new document to the database.
   * Copies the temporary file to a permanent document directory location.
   */
  async saveDocument(transactionId: string, tempUri: string, type: string = 'image/jpeg'): Promise<Attachment> {
    // Move to permanent app storage
    const filename = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}.${type.split('/')[1] || 'jpg'}`;
    const permanentUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

    return this.create({
      transactionId,
      fileUrl: permanentUri,
      fileType: type,
    });
  }

  /**
   * Delete an attachment from DB and filesystem
   */
  async deleteDocument(id: string): Promise<void> {
    const attachment = await this.findById(id);
    if (!attachment) return;

    const uri = attachment.fileUrl;

    await this.delete(id); // Soft delete via BaseRepository

    // Clean up filesystem (ignore errors if file is already gone)
    try {
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch (e) {
      console.warn('Failed to delete file from filesystem', e);
    }
  }
}

export const documentRepo = new DocumentRepository();
