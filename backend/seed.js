const bcrypt = require('bcryptjs');
const { sequelize, User, Department, AssetCategory, Asset, AssetAllocation } = require('./models');

const seed = async () => {
  try {
    // Connect and reset database tables (force sync)
    await sequelize.sync({ force: true });
    console.log('✔ Database tables reset successfully.');

    const salt = await bcrypt.genSalt(10);
    const hashPassword = async (pass) => bcrypt.hash(pass, salt);

    // 1. Create Departments
    const itDept = await Department.create({ name: 'Information Technology', status: 'Active' });
    const hrDept = await Department.create({ name: 'Human Resources', status: 'Active' });
    const financeDept = await Department.create({ name: 'Finance', status: 'Active' });

    console.log('✔ Departments seeded.');

    // 2. Create Users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@assetflow.com',
      passwordHash: await hashPassword('admin123'),
      role: 'Admin',
      status: 'Active',
      departmentId: itDept.id
    });

    const managerUser = await User.create({
      name: 'Sarah Manager',
      email: 'manager@assetflow.com',
      passwordHash: await hashPassword('manager123'),
      role: 'Asset Manager',
      status: 'Active',
      departmentId: itDept.id
    });

    const priyaUser = await User.create({
      name: 'Priya Sharma',
      email: 'priya@assetflow.com',
      passwordHash: await hashPassword('priya123'),
      role: 'Employee',
      status: 'Active',
      departmentId: hrDept.id
    });

    const rajUser = await User.create({
      name: 'Raj Patel',
      email: 'raj@assetflow.com',
      passwordHash: await hashPassword('raj123'),
      role: 'Employee',
      status: 'Active',
      departmentId: financeDept.id
    });

    const auditorUser = await User.create({
      name: 'Arjun Auditor',
      email: 'auditor@assetflow.com',
      passwordHash: await hashPassword('auditor123'),
      role: 'Employee', // Assigned as Auditor in cycles
      status: 'Active',
      departmentId: itDept.id
    });

    // Set IT Dept Head to Admin, HR Head to Priya
    itDept.departmentHeadId = adminUser.id;
    await itDept.save();
    
    hrDept.departmentHeadId = priyaUser.id;
    await hrDept.save();

    console.log('✔ Users & Department heads seeded.');

    // 3. Create Asset Categories
    const electronics = await AssetCategory.create({
      name: 'Electronics',
      customFields: [
        { name: 'warranty_months', type: 'number', label: 'Warranty Period (Months)', required: true },
        { name: 'ram_gb', type: 'number', label: 'RAM Size (GB)', required: false }
      ]
    });

    const furniture = await AssetCategory.create({
      name: 'Furniture',
      customFields: [
        { name: 'material', type: 'text', label: 'Material Wood/Steel', required: true }
      ]
    });

    const vehicles = await AssetCategory.create({
      name: 'Vehicles',
      customFields: [
        { name: 'fuel_type', type: 'text', label: 'Fuel Type', required: true },
        { name: 'insurance_expiry', type: 'date', label: 'Insurance Expiration Date', required: false }
      ]
    });

    console.log('✔ Asset categories seeded.');

    // 4. Create Assets
    const laptop1 = await Asset.create({
      name: 'MacBook Pro 16"',
      assetTag: 'AF-0001',
      serialNumber: 'SN-MBP100234',
      acquisitionDate: '2025-01-10',
      acquisitionCost: 1999.00,
      condition: 'New',
      location: 'IT Storage Rm 4',
      sharedBookable: false,
      status: 'Available',
      categoryId: electronics.id,
      customFieldValues: { warranty_months: 24, ram_gb: 16 }
    });

    const laptop2 = await Asset.create({
      name: 'Dell Latitude 5420',
      assetTag: 'AF-0002',
      serialNumber: 'SN-DELL99482',
      acquisitionDate: '2024-06-15',
      acquisitionCost: 1100.00,
      condition: 'Good',
      location: 'HR Wing A Desk 3',
      sharedBookable: false,
      status: 'Allocated',
      categoryId: electronics.id,
      departmentId: hrDept.id,
      customFieldValues: { warranty_months: 12, ram_gb: 8 }
    });

    const confRoomB2 = await Asset.create({
      name: 'Conference Room B2',
      assetTag: 'AF-0003',
      serialNumber: 'SN-ROOMB2-FLOOR2',
      acquisitionDate: '2023-08-01',
      acquisitionCost: 5000.00,
      condition: 'Good',
      location: 'Floor 2 Office Hub',
      sharedBookable: true, // Bookable shared resource
      status: 'Available',
      categoryId: furniture.id,
      customFieldValues: { material: 'Glass & Mahogany Wood' }
    });

    const projector = await Asset.create({
      name: 'Epson Wireless Projector',
      assetTag: 'AF-0004',
      serialNumber: 'SN-EPSON883',
      acquisitionDate: '2024-11-20',
      acquisitionCost: 450.00,
      condition: 'Good',
      location: 'Floor 2 Meeting Cabinet',
      sharedBookable: true, // Bookable shared resource
      status: 'Available',
      categoryId: electronics.id,
      customFieldValues: { warranty_months: 12 }
    });

    const vehicle1 = await Asset.create({
      name: 'Tesla Model 3 Executive',
      assetTag: 'AF-0005',
      serialNumber: 'SN-TSLA3992',
      acquisitionDate: '2023-12-05',
      acquisitionCost: 45000.00,
      condition: 'Good',
      location: 'Basement Parking Slot 12',
      sharedBookable: false,
      status: 'Available',
      categoryId: vehicles.id,
      customFieldValues: { fuel_type: 'Electric', insurance_expiry: '2027-12-05' }
    });

    console.log('✔ Assets registered.');

    // 5. Create Allocation for Dell Latitude held by Priya
    await AssetAllocation.create({
      assetId: laptop2.id,
      employeeId: priyaUser.id,
      allocatedById: managerUser.id,
      status: 'Active',
      allocationDate: '2025-06-15',
      expectedReturnDate: '2026-06-15' // Overdue by today's date in 2026-07-12
    });

    console.log('✔ Allocations seeded.');
    console.log('✔ Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('✘ Seed error:', error);
    process.exit(1);
  }
};

seed();
