import type { Context } from 'koa'
import { factories, type Core } from '@strapi/strapi';
import axios from 'axios';
import qs from 'qs';
import type { PluginSettingsMailchimpOAuth } from '../types/config/plugin'

export default factories.createCoreController('plugin::prokodo-cat.mailchimp', ({ strapi }): Core.Controller => ({
  /**
   * Initiates the OAuth2 flow by redirecting the user to Mailchimp's authorization page.
   */
  async connect(ctx):Promise<Context | undefined> {
    const user = ctx.state.user;

    if (!user) {
      return ctx.forbidden('Unauthorized');
    }

    const { clientId, redirectUri } = strapi.config.get<PluginSettingsMailchimpOAuth>('plugin.prokodo-cat.auth.mailchimp');
    const scope = 'list:read audience:read'; // Adjust scopes as needed

    // Generate a unique state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);

    // Store the state parameter in the user's session
    ctx.session.mailchimpState = state;

    const authorizationUrl = `https://login.mailchimp.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scope)}&state=${state}`;

    ctx.redirect(authorizationUrl);
  },

  /**
   * Handles the OAuth2 callback, exchanges the authorization code for access tokens,
   * and stores them securely associated with the user.
   */
  async callback(ctx):Promise<Context | undefined> {
    const user = ctx.state.user;

    if (!user) {
      return ctx.forbidden('Unauthorized');
    }

    const { code, state } = ctx.query;

    if (!code || !state) {
      return ctx.badRequest('Missing code or state parameter.');
    }

    // Verify state parameter
    if (state !== ctx.session.mailchimpState) {
      return ctx.badRequest('Invalid state parameter.');
    }

    // Clear the stored state
    ctx.session.mailchimpState = null;

    const { clientId, clientSecret, redirectUri } = strapi.config.get<PluginSettingsMailchimpOAuth>('plugin.prokodo-cat.auth.mailchimp');

    const tokenUrl = 'https://login.mailchimp.com/oauth2/token';

    const data = qs.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });

    try {
      const response = await axios.post(tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, refresh_token, expires_in, scope } = response.data;

      // Save tokens associated with the user
      const mailchimpAccount = await strapi
        .service('plugin::prokodo-cat.mailchimp')
        .findOneByUser(user.id);

      if (mailchimpAccount) {
        // Update existing account
        await strapi
          .service('plugin::prokodo-cat.mailchimp')
          .updateForUser(user.id, {
            access_token,
            refresh_token,
            expires_in,
            scope,
          });
      } else {
        // Create new account
        await strapi
          .service('plugin::prokodo-cat.mailchimp')
          .createForUser(user.id, {
            access_token,
            refresh_token,
            expires_in,
            scope,
            mailchimp_server_prefix: '', // Initialize with empty strings; users will set via frontend
            mailchimp_list_id: '',
            mailchimp_segment_id: '',
            mailchimp_template_id: '',
          });
      }

      // Redirect back to the plugin's admin page
      ctx.redirect('/admin/plugins/prokodo-cat');
    } catch (error: any) {
      strapi.log.error('Error exchanging authorization code:', error.response?.data || error.message);
      return ctx.internalServerError('Failed to exchange authorization code for tokens.');
    }
  },

  /**
   * Retrieves the current connection status and Mailchimp configurations for the user.
   */
  async status(ctx):Promise<Context | undefined> {
    const user = ctx.state.user;

    if (!user) {
      return ctx.forbidden('Unauthorized');
    }

    try {
      const mailchimpAccount = await strapi
        .service('plugin::prokodo-cat.mailchimp')
        .findOneByUser(user.id);

      if (!mailchimpAccount) {
        return ctx.send({ connected: false });
      }

      // Optionally, verify token validity by making a test API call
      // For simplicity, we'll assume it's valid if it exists
      return ctx.send({ connected: true });
    } catch (error) {
      strapi.log.error('Error fetching Mailchimp status:', error);
      return ctx.internalServerError('Failed to retrieve Mailchimp status.');
    }
  },

  /**
   * Disconnects the Mailchimp account for the user.
   */
  async disconnect(ctx):Promise<Context | undefined> {
    const user = ctx.state.user;

    if (!user) {
      return ctx.forbidden('Unauthorized');
    }

    try {
      await strapi.service('plugin::prokodo-cat.mailchimp').deleteForUser(user.id);
      return ctx.send({ message: 'Mailchimp account disconnected successfully.' });
    } catch (error) {
      strapi.log.error('Error disconnecting Mailchimp account:', error);
      return ctx.internalServerError('Failed to disconnect Mailchimp account.');
    }
  },

  /**
   * Updates the Mailchimp configuration for the user.
   */
  async updateConfig(ctx):Promise<Context | undefined> {
    const user = ctx.state.user;

    if (!user) {
      return ctx.forbidden('Unauthorized');
    }

    const { mailchimp_server_prefix, mailchimp_list_id, mailchimp_segment_id, mailchimp_template_id } = ctx.request.body;

    // Validate input
    if (!mailchimp_server_prefix || !mailchimp_list_id || !mailchimp_template_id) {
      return ctx.badRequest('Mailchimp Server Prefix, List ID, and Template ID are required.');
    }

    try {
      const mailchimpAccount = await strapi
        .service('plugin::prokodo-cat.mailchimp')
        .findOneByUser(user.id);

      if (!mailchimpAccount) {
        return ctx.badRequest('Mailchimp account not connected.');
      }

      const updatedData = {
        mailchimp_server_prefix,
        mailchimp_list_id,
        mailchimp_segment_id,
        mailchimp_template_id,
      };

      // Update the mailchimp record
      await strapi.service('plugin::prokodo-cat.mailchimp').updateForUser(user.id, updatedData);

      return ctx.send({ message: 'Mailchimp configuration updated successfully.' });
    } catch (error) {
      strapi.log.error('Error updating Mailchimp configuration:', error);
      return ctx.internalServerError('Failed to update Mailchimp configuration.');
    }
  },
}));
