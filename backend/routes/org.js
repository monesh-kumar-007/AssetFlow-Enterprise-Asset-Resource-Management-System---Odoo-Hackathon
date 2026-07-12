const express = require('express');
const router = express.Router();
const { User, Department, AssetCategory } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/logger');

// --- DEPARTMENT MANAGEMENT ---

// GET /api/org/departments - List all departments (accessible by all authenticated users)
router.get('/departments', authenticate, async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        { model: Department, as: 'ParentDepartment', attributes: ['id', 'name'] },
        { model: User, as: 'DepartmentHead', attributes: ['id', 'name', 'email'] }
      ]
    });
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch departments.', error: error.message });
  }
});

// POST /api/org/departments - Create a new department (Admin only)
router.post('/departments', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, parentDepartmentId, departmentHeadId, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    const dept = await Department.create({
      name,
      parentDepartmentId: parentDepartmentId || null,
      departmentHeadId: departmentHeadId || null,
      status: status || 'Active',
    });

    // If a head is assigned, update that user's role to Department Head if they are currently an Employee
    if (departmentHeadId) {
      const user = await User.findByPk(departmentHeadId);
      if (user && user.role === 'Employee') {
        user.role = 'Department Head';
        user.departmentId = dept.id;
        await user.save();
        await createNotification({
          userId: user.id,
          message: `You have been assigned as the Head of ${name} department.`,
          type: 'Role Promotion'
        });
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'CREATE_DEPARTMENT',
      targetType: 'Department',
      targetId: dept.id,
      details: `Created department: ${name}`,
    });

    return res.status(201).json(dept);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create department.', error: error.message });
  }
});

// PUT /api/org/departments/:id - Update an existing department (Admin only)
router.put('/departments/:id', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, parentDepartmentId, departmentHeadId, status } = req.body;
    const dept = await Department.findByPk(req.params.id);

    if (!dept) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // Prevent circular parent hierarchy
    if (parentDepartmentId && parentDepartmentId === dept.id) {
      return res.status(400).json({ message: 'A department cannot be its own parent.' });
    }

    dept.name = name !== undefined ? name : dept.name;
    dept.parentDepartmentId = parentDepartmentId !== undefined ? (parentDepartmentId || null) : dept.parentDepartmentId;
    dept.departmentHeadId = departmentHeadId !== undefined ? (departmentHeadId || null) : dept.departmentHeadId;
    dept.status = status !== undefined ? status : dept.status;

    await dept.save();

    // If head is changed/assigned
    if (departmentHeadId) {
      const user = await User.findByPk(departmentHeadId);
      if (user && user.role === 'Employee') {
        user.role = 'Department Head';
        user.departmentId = dept.id;
        await user.save();
        await createNotification({
          userId: user.id,
          message: `You have been promoted to Department Head of ${dept.name}.`,
          type: 'Role Promotion'
        });
      }
    }

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_DEPARTMENT',
      targetType: 'Department',
      targetId: dept.id,
      details: `Updated department: ${dept.name} (${status || dept.status})`,
    });

    return res.json(dept);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update department.', error: error.message });
  }
});


// --- ASSET CATEGORY MANAGEMENT ---

// GET /api/org/categories - Get all categories (accessible by all authenticated users)
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await AssetCategory.findAll();
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch categories.', error: error.message });
  }
});

// POST /api/org/categories - Create category (Admin only)
router.post('/categories', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, customFields } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const category = await AssetCategory.create({
      name,
      customFields: customFields || []
    });

    await logActivity({
      userId: req.user.id,
      action: 'CREATE_CATEGORY',
      targetType: 'AssetCategory',
      targetId: category.id,
      details: `Created asset category: ${name}`,
    });

    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create category.', error: error.message });
  }
});

// PUT /api/org/categories/:id - Update category (Admin only)
router.put('/categories/:id', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, customFields } = req.body;
    const category = await AssetCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    category.name = name !== undefined ? name : category.name;
    category.customFields = customFields !== undefined ? customFields : category.customFields;
    await category.save();

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_CATEGORY',
      targetType: 'AssetCategory',
      targetId: category.id,
      details: `Updated category: ${category.name}`,
    });

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update category.', error: error.message });
  }
});


// --- EMPLOYEE DIRECTORY & PROMOTION ---

// GET /api/org/employees - List all employees (accessible by all authenticated users)
router.get('/employees', authenticate, async (req, res) => {
  try {
    const employees = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      include: [{ model: Department, attributes: ['id', 'name'] }]
    });
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch employee directory.', error: error.message });
  }
});

// PUT /api/org/employees/:id/role - Promote/Change employee role (Admin only)
router.put('/employees/:id/role', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['Admin', 'Asset Manager', 'Department Head', 'Employee'];
    
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid or missing role.' });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(403).json({ message: 'You cannot change your own role.' });
    }

    const employee = await User.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    const oldRole = employee.role;
    employee.role = role;
    await employee.save();

    await createNotification({
      userId: employee.id,
      message: `Your role has been updated from ${oldRole} to ${role} by Admin.`,
      type: 'Role Promotion'
    });

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_USER_ROLE',
      targetType: 'User',
      targetId: employee.id,
      details: `Promoted/Changed ${employee.name} role from ${oldRole} to ${role}.`,
    });

    return res.json({ message: `Successfully updated role to ${role}.`, employee });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update employee role.', error: error.message });
  }
});

// PUT /api/org/employees/:id/status - Change employee status (Active/Inactive) (Admin only)
router.put('/employees/:id/status', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Active or Inactive.' });
    }

    const employee = await User.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Prevent admin from deactivating themselves
    if (employee.id === req.user.id && status === 'Inactive') {
      return res.status(400).json({ message: 'You cannot deactivate your own Admin account.' });
    }

    employee.status = status;
    await employee.save();

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_USER_STATUS',
      targetType: 'User',
      targetId: employee.id,
      details: `Changed ${employee.name} status to ${status}.`,
    });

    return res.json({ message: `Successfully set user status to ${status}.`, employee });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user status.', error: error.message });
  }
});

// PUT /api/org/employees/:id/department - Assign user to department (Admin only)
router.put('/employees/:id/department', authenticate, requireRole(['Admin']), async (req, res) => {
  try {
    const { departmentId } = req.body;
    const employee = await User.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    if (departmentId) {
      const dept = await Department.findByPk(departmentId);
      if (!dept) {
        return res.status(400).json({ message: 'Department not found.' });
      }
    }

    employee.departmentId = departmentId || null;
    await employee.save();

    await logActivity({
      userId: req.user.id,
      action: 'UPDATE_USER_DEPARTMENT',
      targetType: 'User',
      targetId: employee.id,
      details: `Assigned ${employee.name} to department.`,
    });

    return res.json({ message: 'Department updated.', employee });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update department.', error: error.message });
  }
});

module.exports = router;
