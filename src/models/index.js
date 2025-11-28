const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    host: config.development.host,
    port: config.development.port,
    dialect: config.development.dialect,
    logging: config.development.logging
  }
);

const models = {
  User: require('./User')(sequelize),
  
  // BAPB Models
  BAPB: require('./BAPB')(sequelize),
  BAPBItem: require('./BAPBItem')(sequelize),
  BAPBApproval: require('./BAPBApproval')(sequelize),
  BAPBAttachment: require('./BAPBAttachment')(sequelize),
  
  // BAPP Models
  BAPP: require('./BAPP')(sequelize),
  BAPPWorkItem: require('./BAPPWorkItem')(sequelize),
  BAPPApproval: require('./BAPPApproval')(sequelize),
  BAPPAttachment: require('./BAPPAttachment')(sequelize)
};

// BAPB Associations
models.BAPB.belongsTo(models.User, { as: 'vendor', foreignKey: 'vendorId' });
models.BAPB.belongsTo(models.User, { as: 'picGudang', foreignKey: 'picGudangId' });
models.BAPB.hasMany(models.BAPBItem, { foreignKey: 'bapbId', as: 'items' });
models.BAPB.hasMany(models.BAPBApproval, { foreignKey: 'bapbId', as: 'approvals' });
models.BAPB.hasMany(models.BAPBAttachment, { foreignKey: 'bapbId', as: 'attachments' });

models.BAPBItem.belongsTo(models.BAPB, { foreignKey: 'bapbId' });
models.BAPBApproval.belongsTo(models.BAPB, { foreignKey: 'bapbId' });
models.BAPBApproval.belongsTo(models.User, { as: 'approver', foreignKey: 'approverId' });
models.BAPBAttachment.belongsTo(models.BAPB, { foreignKey: 'bapbId' });

// BAPP Associations
models.BAPP.belongsTo(models.User, { as: 'vendor', foreignKey: 'vendorId' });
models.BAPP.belongsTo(models.User, { as: 'direksiPekerjaan', foreignKey: 'direksiPekerjaanId' });
models.BAPP.hasMany(models.BAPPWorkItem, { foreignKey: 'bappId', as: 'workItems' });
models.BAPP.hasMany(models.BAPPApproval, { foreignKey: 'bappId', as: 'approvals' });
models.BAPP.hasMany(models.BAPPAttachment, { foreignKey: 'bappId', as: 'attachments' });

models.BAPPWorkItem.belongsTo(models.BAPP, { foreignKey: 'bappId' });
models.BAPPApproval.belongsTo(models.BAPP, { foreignKey: 'bappId' });
models.BAPPApproval.belongsTo(models.User, { as: 'approver', foreignKey: 'approverId' });
models.BAPPAttachment.belongsTo(models.BAPP, { foreignKey: 'bappId' });

module.exports = { sequelize, ...models };