
export default {
  collectionName: 'prokodo_cat_mailchimp_accounts',
  info: {
    singularName: 'mailchimp-account',
    pluralName: 'mailchimp-accounts',
    displayName: 'Mailchimp Account',
    description: 'Stores Mailchimp account credentials for each user',
  },
  options: {
    draftAndPublish: false,
    timestamps: true,
  },
  attributes: {
    user: {
      type: 'relation',
      relation: 'oneToOne',
      target: 'admin::user',
      unique: true,
      required: true,
      configurable: false,
    },
    access_token: {
      type: 'string',
      required: true,
      private: true, // Ensures tokens are not exposed via APIs
      configurable: false,
    },
    refresh_token: {
      type: 'string',
      required: true,
      private: true,
      configurable: false,
    },
    expires_in: {
      type: 'integer',
      required: true,
      configurable: false,
    },
    scope: {
      type: 'string',
      required: true,
      configurable: false,
    },
    mailchimp_server_prefix: {
      type: 'string',
      required: true,
      configurable: true,
      description: 'Mailchimp server prefix (e.g., us1, us2)',
    },
    mailchimp_list_id: {
      type: 'string',
      required: true,
      configurable: true,
      description: 'Mailchimp List ID',
    },
    mailchimp_segment_id: {
      type: 'string',
      required: false,
      configurable: true,
      description: 'Mailchimp Segment ID (optional)',
    },
    mailchimp_template_id: {
      type: 'string',
      required: true,
      configurable: true,
      description: 'Mailchimp Template ID',
    },
  },
};
