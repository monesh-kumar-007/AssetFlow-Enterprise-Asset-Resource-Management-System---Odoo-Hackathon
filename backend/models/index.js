const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 1. User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Asset Manager', 'Department Head', 'Employee'),
    defaultValue: 'Employee',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
    allowNull: false,
  },
});

// 2. Department
const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active',
    allowNull: false,
  },
});

// 3. AssetCategory
const AssetCategory = sequelize.define('AssetCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  customFields: {
    type: DataTypes.JSON, // e.g. [{"name": "warranty_months", "type": "number", "required": true}]
    defaultValue: [],
  },
});

// 4. Asset
const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assetTag: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  serialNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  acquisitionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  acquisitionCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  condition: {
    type: DataTypes.ENUM('New', 'Good', 'Fair', 'Poor'),
    defaultValue: 'New',
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sharedBookable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'),
    defaultValue: 'Available',
    allowNull: false,
  },
  customFieldValues: {
    type: DataTypes.JSON, // e.g. {"warranty_months": 24}
    defaultValue: {},
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  documentUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// 5. AssetAllocation
const AssetAllocation = sequelize.define('AssetAllocation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  allocationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expectedReturnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  actualReturnDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  returnNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Returned', 'Transferred'),
    defaultValue: 'Active',
    allowNull: false,
  },
});

// 6. TransferRequest
const TransferRequest = sequelize.define('TransferRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    defaultValue: 'Pending',
    allowNull: false,
  },
  actionedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// 7. ResourceBooking
const ResourceBooking = sequelize.define('ResourceBooking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled'),
    defaultValue: 'Upcoming',
    allowNull: false,
  },
});

// 8. MaintenanceRequest
const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High'),
    defaultValue: 'Medium',
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved'),
    defaultValue: 'Pending',
    allowNull: false,
  },
  technicianName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

// 9. AuditCycle
const AuditCycle = sequelize.define('AuditCycle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scopeType: {
    type: DataTypes.ENUM('Department', 'Location', 'All'),
    allowNull: false,
  },
  scopeValue: {
    type: DataTypes.STRING,
    allowNull: true, // e.g. Specific department ID or location name
  },
  auditorIds: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Active', 'Closed'),
    defaultValue: 'Draft',
    allowNull: false,
  },
});

// 10. AuditAsset
const AuditAsset = sequelize.define('AuditAsset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  verifiedStatus: {
    type: DataTypes.ENUM('Verified', 'Missing', 'Damaged'),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  auditedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// 11. Notification
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false, // e.g. "Asset Assigned", "Maintenance Approved"
  },
});

// 12. ActivityLog
const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// --- ASSOCIATIONS & RELATIONSHIPS ---

// Department self-relation (Hierarchy)
Department.belongsTo(Department, { as: 'ParentDepartment', foreignKey: 'parentDepartmentId' });
Department.hasMany(Department, { as: 'SubDepartments', foreignKey: 'parentDepartmentId' });

// Department Head relation
Department.belongsTo(User, { as: 'DepartmentHead', foreignKey: 'departmentHeadId' });

// User belongs to Department
User.belongsTo(Department, { foreignKey: 'departmentId' });
Department.hasMany(User, { foreignKey: 'departmentId' });

// Asset belongs to Category and Department
Asset.belongsTo(AssetCategory, { foreignKey: 'categoryId' });
AssetCategory.hasMany(Asset, { foreignKey: 'categoryId' });

Asset.belongsTo(Department, { foreignKey: 'departmentId' });
Department.hasMany(Asset, { foreignKey: 'departmentId' });

// Asset Allocation relations
AssetAllocation.belongsTo(Asset, { foreignKey: 'assetId' });
Asset.hasMany(AssetAllocation, { foreignKey: 'assetId' });

AssetAllocation.belongsTo(User, { as: 'Employee', foreignKey: 'employeeId' });
User.hasMany(AssetAllocation, { as: 'Allocations', foreignKey: 'employeeId' });

AssetAllocation.belongsTo(Department, { foreignKey: 'departmentId' });
Department.hasMany(AssetAllocation, { foreignKey: 'departmentId' });

AssetAllocation.belongsTo(User, { as: 'AllocatedBy', foreignKey: 'allocatedById' });

// Transfer Request relations
TransferRequest.belongsTo(Asset, { foreignKey: 'assetId' });
Asset.hasMany(TransferRequest, { foreignKey: 'assetId' });

TransferRequest.belongsTo(User, { as: 'CurrentHolder', foreignKey: 'currentHolderId' });
TransferRequest.belongsTo(User, { as: 'TargetHolder', foreignKey: 'targetHolderId' });
TransferRequest.belongsTo(User, { as: 'RequestedBy', foreignKey: 'requestedById' });
TransferRequest.belongsTo(User, { as: 'ActionedBy', foreignKey: 'actionedById' });

// Resource Booking relations
ResourceBooking.belongsTo(Asset, { foreignKey: 'assetId' });
Asset.hasMany(ResourceBooking, { foreignKey: 'assetId' });

ResourceBooking.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ResourceBooking, { foreignKey: 'userId' });

// Maintenance Request relations
MaintenanceRequest.belongsTo(Asset, { foreignKey: 'assetId' });
Asset.hasMany(MaintenanceRequest, { foreignKey: 'assetId' });

MaintenanceRequest.belongsTo(User, { as: 'RaisedBy', foreignKey: 'raisedById' });
MaintenanceRequest.belongsTo(User, { as: 'ApprovedBy', foreignKey: 'approvedById' });

// Audit relations
AuditAsset.belongsTo(AuditCycle, { foreignKey: 'auditCycleId' });
AuditCycle.hasMany(AuditAsset, { foreignKey: 'auditCycleId' });

AuditAsset.belongsTo(Asset, { foreignKey: 'assetId' });
Asset.hasMany(AuditAsset, { foreignKey: 'assetId' });

AuditAsset.belongsTo(User, { as: 'Auditor', foreignKey: 'auditorId' });

// Notifications & Activity Logs
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });

ActivityLog.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ActivityLog, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Department,
  AssetCategory,
  Asset,
  AssetAllocation,
  TransferRequest,
  ResourceBooking,
  MaintenanceRequest,
  AuditCycle,
  AuditAsset,
  Notification,
  ActivityLog,
};
