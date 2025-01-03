export default [
  {
    method: 'POST',
    path: '/content/generate',
    handler: 'content.generateContent',
    config: {
      policies: [
        {
          name: 'plugin::pokodoCAT.checkCustomPermission',
          config: { action: 'prokodoCAT.content.create' },
        },
      ],
    },
  },
];
