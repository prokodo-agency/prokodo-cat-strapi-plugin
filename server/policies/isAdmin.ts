export default async (ctx, config, { strapi }) => {
    const { state: { user } } = ctx;
  
    if (!user || user.role.type !== 'administrator') {
      return ctx.unauthorized('You must be an administrator to perform this action.');
    }
  
    // Continue to the next policy or controller
    await true;
};