import { z } from 'zod';

export const MailchimpAccountSchema = z.object({
    user: z.number().min(1, 'Mailchimp user is required'),
    access_token: z.string().min(1, 'Mailchimp Access Token is required'),
    refresh_token: z.string().min(1, 'Mailchimp Refresh Token is required'),
    expires_in: z.number().min(1, 'Mailchimp expiration date of token is required'),
    scope: z.string().min(1, 'Mailchimp scope is required'),
    mailchimp_server_prefix: z.string().min(1, 'Mailchimp Server Prefix is required'),
    mailchimp_list_id: z.string().min(1, 'Mailchimp List ID is required'),
    mailchimp_segment_id: z.string().optional(),
    mailchimp_template_id: z.string().min(1, 'Mailchimp Template ID is required'),
});

export type MailchimpAccount = z.infer<typeof MailchimpAccountSchema>;
