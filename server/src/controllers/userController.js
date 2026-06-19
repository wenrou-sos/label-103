const { User } = require('../models');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, role, status, keyword } = req.query;

    const where = {};

    if (role) where.role = role;
    if (status) where.status = status;

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { realName: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const result = await paginate(User, {
      page,
      pageSize,
      where,
      attributes: { exclude: ['password'] },
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get users error:', error);
    errorResponse(res, '获取用户列表失败', 500);
  }
};

const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    successResponse(res, user);
  } catch (error) {
    console.error('Get user detail error:', error);
    errorResponse(res, '获取用户详情失败', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, realName, phone, email, idCard, role, status } = req.body;

    if (!username || !password) {
      return errorResponse(res, '用户名和密码不能为空');
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return errorResponse(res, '用户名已存在');
    }

    const user = await User.create({
      username,
      password,
      realName,
      phone,
      email,
      idCard,
      role: role || 'member',
      status: status || 'active',
    });

    const userData = user.toJSON();
    delete userData.password;

    successResponse(res, userData, '用户创建成功');
  } catch (error) {
    console.error('Create user error:', error);
    errorResponse(res, '创建用户失败', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { realName, phone, email, idCard, role, status, avatar } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    if (realName !== undefined) user.realName = realName;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (idCard !== undefined) user.idCard = idCard;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    successResponse(res, userData, '用户更新成功');
  } catch (error) {
    console.error('Update user error:', error);
    errorResponse(res, '更新用户失败', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    if (user.id === req.user.id) {
      return errorResponse(res, '不能删除自己的账户');
    }

    await user.destroy();

    successResponse(res, null, '用户删除成功');
  } catch (error) {
    console.error('Delete user error:', error);
    errorResponse(res, '删除用户失败', 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return errorResponse(res, '新密码不能为空');
    }

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    successResponse(res, null, '密码重置成功');
  } catch (error) {
    console.error('Reset password error:', error);
    errorResponse(res, '重置密码失败', 500);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, '状态不能为空');
    }

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    if (user.id === req.user.id && status !== 'active') {
      return errorResponse(res, '不能禁用自己的账户');
    }

    user.status = status;
    await user.save();

    successResponse(res, null, '状态更新成功');
  } catch (error) {
    console.error('Update user status error:', error);
    errorResponse(res, '更新状态失败', 500);
  }
};

module.exports = {
  getUsers,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  updateUserStatus,
};
