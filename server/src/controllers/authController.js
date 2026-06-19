const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const dayjs = require('dayjs');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return errorResponse(res, '用户名和密码不能为空');
    }

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return errorResponse(res, '用户名或密码错误');
    }

    if (user.status !== 'active') {
      return errorResponse(res, '账号已被禁用，请联系管理员');
    }

    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return errorResponse(res, '用户名或密码错误');
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    successResponse(res, {
      token,
      user: user.toJSON(),
    }, '登录成功');
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, '登录失败，请稍后重试', 500);
  }
};

const register = async (req, res) => {
  try {
    const { username, password, phone, realName } = req.body;

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
      phone,
      realName,
      role: 'member',
      status: 'active',
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    successResponse(res, {
      token,
      user: user.toJSON(),
    }, '注册成功');
  } catch (error) {
    console.error('Register error:', error);
    errorResponse(res, '注册失败，请稍后重试', 500);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    successResponse(res, {
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    errorResponse(res, '获取用户信息失败', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { realName, phone, email, idCard, avatar } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    if (realName !== undefined) user.realName = realName;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (idCard !== undefined) user.idCard = idCard;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    successResponse(res, { user: user.toJSON() }, '个人信息更新成功');
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, '更新个人信息失败', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return errorResponse(res, '旧密码和新密码不能为空');
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return errorResponse(res, '用户不存在');
    }

    const isValidPassword = await user.validatePassword(oldPassword);
    if (!isValidPassword) {
      return errorResponse(res, '旧密码错误');
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    successResponse(res, null, '密码修改成功');
  } catch (error) {
    console.error('Change password error:', error);
    errorResponse(res, '修改密码失败', 500);
  }
};

const logout = async (req, res) => {
  try {
    successResponse(res, null, '退出登录成功');
  } catch (error) {
    errorResponse(res, '退出登录失败', 500);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
};
