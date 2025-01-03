import { factories } from '@strapi/strapi';
import { type MailchimpAccount, MailchimpAccountSchema } from '../../types/config/mailchimp'

const parseMailchimpAccountData = (data: Partial<MailchimpAccount>): MailchimpAccount => {
    // Validate and parse the updated settings
    const parsedData = MailchimpAccountSchema.safeParse(data);

    if (!parsedData.success) {
      const formattedErrors = parsedData.error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      strapi.log.error(`Invalid mailchimp account credentials: ${formattedErrors}`);
      throw new Error('Invalid mailchimp account credentials.');
    }

    return parsedData.data;
}

export default factories.createCoreService('plugin::prokodoCAT.mailchimp-account', ({ strapi }) => ({
  /**
   * Finds a Mailchimp account by user ID.
   * @param userId - The ID of the user.
   * @returns The Mailchimp account or null.
   */
  async findOneByUser(userId: number) {
    const entry = await strapi.db.query('plugin::prokodoCAT.mailchimp-account').findOne({
      where: { user: userId },
    });
    return entry;
  },

  /**
   * Creates a Mailchimp account for a user.
   * @param userId - The ID of the user.
   * @param data - The Mailchimp account data.
   * @returns The created Mailchimp account.
   */
  async createForUser(userId: number, data: Partial<MailchimpAccount>) {
    const parsedData = parseMailchimpAccountData(data)
    const createdEntry = await strapi.db.query('plugin::prokodoCAT.mailchimp-account').create({
      data: {
        ...parsedData,
        user: userId,
      },
    });
    return createdEntry;
  },

  /**
   * Updates a Mailchimp account by user ID.
   * @param userId - The ID of the user.
   * @param data - The data to update.
   * @returns The updated Mailchimp account.
   */
  async updateForUser(userId: number, data: Partial<MailchimpAccount>) {
    const parsedData = parseMailchimpAccountData(data)
    const entry = await this.findOneByUser(userId);
    if (!entry) {
      throw new Error('Mailchimp account not found.');
    }

    const updatedEntry = await strapi.db.query('plugin::prokodoCAT.mailchimp-account').update({
      where: { id: entry.id },
      data: parsedData,
    });
    return updatedEntry;
  },

  /**
   * Deletes a Mailchimp account by user ID.
   * @param userId - The ID of the user.
   */
  async deleteForUser(userId: number) {
    const entry = await this.findOneByUser(userId);
    if (!entry) {
      throw new Error('Mailchimp account not found.');
    }

    await strapi.db.query('plugin::prokodoCAT.mailchimp-account').delete({
      where: { id: entry.id },
    });
  },
}));
