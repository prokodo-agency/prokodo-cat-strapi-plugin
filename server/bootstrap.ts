import { Core } from '@strapi/strapi';

const customPermissions = [
  {
    section: 'plugins',
    displayName: 'Read Content',
    uid: 'prokodoCAT.content.read',
    pluginName: 'pokodoCAT',
  },
  {
    section: 'plugins',
    displayName: 'Update Content',
    uid: 'prokodoCAT.content.update',
    pluginName: 'pokodoCAT',
  },
  {
    section: 'plugins',
    displayName: 'Delete Content',
    uid: 'prokodoCAT.content.delete',
    pluginName: 'pokodoCAT',
  },
  {
    section: 'plugins',
    displayName: 'Create Content',
    uid: 'prokodoCAT.content.create',
    pluginName: 'pokodoCAT',
  },
  {
    section: 'plugins',
    displayName: 'Publish Content',
    uid: 'prokodoCAT.content.publish',
    pluginName: 'pokodoCAT',
  },
];

export default async ({ strapi }: { strapi: Core.Strapi }) => {
  // Register permissions with the Users & Permissions plugin
  await strapi.admin.services.permission.actionProvider.registerMany(customPermissions);
};
