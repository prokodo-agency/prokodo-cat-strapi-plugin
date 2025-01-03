module.exports = (plugin) => {
  if (plugin.name === 'users-permissions') {
    plugin.contentTypes.role.attributes.custom_permissions = {
      type: 'relation',
      relation: 'manyToMany',
      target: 'plugin::prokodo-cat.permissions',
      inversedBy: 'roles',
      configurable: false,
      visible: true,
      via: 'roles',
    };
  }

  return plugin;
};
