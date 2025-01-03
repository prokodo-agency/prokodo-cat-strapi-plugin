export default {
  collectionName: 'custom_permissions',
  info: {
    singularName: 'custom-permission',
    pluralName: 'custom-permissions',
    displayName: 'Custom Permission',
    description: 'Define custom permissions for roles.',
  },
  options: {
    draftAndPublish: false,
  },
  attributes: {
    action: {
      type: 'string',
      required: true,
      unique: true,
      description: "Unique identifier for the custom permission (e.g., 'approveContent').",
    },
    description: {
      type: 'text',
      description: 'Human-readable description of the permission.',
    },
    roles: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'plugin::users-permissions.role',
      inversedBy: 'custom_permissions',
      description: 'Roles that have this custom permission.',
    },
  },
} as const;
