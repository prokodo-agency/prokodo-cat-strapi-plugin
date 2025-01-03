const checkCustomPermission = async (context, config, { strapi }) => {
  const { ctx } = context;
  const { user } = ctx.state;

  if (!user) {
    ctx.unauthorized('You must be logged in to perform this action.');
    return;
  }

  const { action } = config;

  if (!action) {
    strapi.log.warn('No action specified for checkCustomPermission policy.');
    ctx.unauthorized('No action specified.');
    return;
  }

  // Check if the user has the required permission
  const hasPermission = await strapi.admin.services.permission.engine.checkManyActions({
    actions: [action],
    user,
  });

  if (!hasPermission) {
    ctx.unauthorized('You do not have the required permission.');
  }
};

export default checkCustomPermission
