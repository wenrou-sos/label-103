const { AmusementProject } = require('../models');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');
const { createAuditLog, ACTIONS, MODULES } = require('../utils/audit');
const { checkProjectAccess } = require('../utils/business');
const { Op } = require('sequelize');

const getAmusementProjects = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, category, isActive, keyword } = req.query;

    const where = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true' || isActive === true;
    }

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { location: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const result = await paginate(AmusementProject, {
      page,
      pageSize,
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    successResponse(res, result);
  } catch (error) {
    console.error('Get amusement projects error:', error);
    errorResponse(res, '获取游玩项目失败', 500);
  }
};

const getActiveAmusementProjects = async (req, res) => {
  try {
    const projects = await AmusementProject.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    successResponse(res, projects);
  } catch (error) {
    console.error('Get active amusement projects error:', error);
    errorResponse(res, '获取游玩项目失败', 500);
  }
};

const getAmusementProjectDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await AmusementProject.findByPk(id);
    if (!project) {
      return errorResponse(res, '游玩项目不存在');
    }

    successResponse(res, project);
  } catch (error) {
    console.error('Get amusement project detail error:', error);
    errorResponse(res, '获取游玩项目详情失败', 500);
  }
};

const createAmusementProject = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      category,
      location,
      minHeight,
      maxHeight,
      minAge,
      maxAge,
      isCharged,
      price,
      duration,
      capacity,
      remarks,
      sortOrder,
      isActive,
    } = req.body;

    if (!name || !code) {
      return errorResponse(res, '项目名称和编码不能为空');
    }

    const existing = await AmusementProject.findOne({ where: { code } });
    if (existing) {
      return errorResponse(res, '项目编码已存在');
    }

    const project = await AmusementProject.create({
      name,
      code,
      description,
      category,
      location,
      minHeight: minHeight === '' ? null : minHeight,
      maxHeight: maxHeight === '' ? null : maxHeight,
      minAge: minAge === '' ? null : minAge,
      maxAge: maxAge === '' ? null : maxAge,
      isCharged,
      price: price || 0,
      duration: duration === '' ? null : duration,
      capacity: capacity === '' ? null : capacity,
      remarks,
      sortOrder,
      isActive,
    });

    await createAuditLog(req, {
      module: MODULES.AMUSEMENT_PROJECT,
      action: ACTIONS.CREATE,
      targetId: project.id,
      description: `创建游玩项目: ${name} (${code})`,
      newData: project.toJSON(),
    });

    successResponse(res, project, '游玩项目创建成功');
  } catch (error) {
    console.error('Create amusement project error:', error);
    errorResponse(res, '创建游玩项目失败', 500);
  }
};

const updateAmusementProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const project = await AmusementProject.findByPk(id);
    if (!project) {
      return errorResponse(res, '游玩项目不存在');
    }

    const oldData = project.toJSON();

    const fields = [
      'name', 'description', 'category', 'location',
      'minHeight', 'maxHeight', 'minAge', 'maxAge',
      'isCharged', 'price', 'duration', 'capacity',
      'remarks', 'sortOrder', 'isActive',
    ];

    fields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (updateData[field] === '') {
          project[field] = ['minHeight', 'maxHeight', 'minAge', 'maxAge', 'duration', 'capacity'].includes(field) ? null : project[field];
        } else {
          project[field] = updateData[field];
        }
      }
    });

    await project.save();

    await createAuditLog(req, {
      module: MODULES.AMUSEMENT_PROJECT,
      action: ACTIONS.UPDATE,
      targetId: project.id,
      description: `更新游玩项目: ${project.name} (${project.code})`,
      oldData,
      newData: project.toJSON(),
    });

    successResponse(res, project, '游玩项目更新成功');
  } catch (error) {
    console.error('Update amusement project error:', error);
    errorResponse(res, '更新游玩项目失败', 500);
  }
};

const deleteAmusementProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await AmusementProject.findByPk(id);
    if (!project) {
      return errorResponse(res, '游玩项目不存在');
    }

    const oldData = project.toJSON();
    await project.destroy();

    await createAuditLog(req, {
      module: MODULES.AMUSEMENT_PROJECT,
      action: ACTIONS.DELETE,
      targetId: project.id,
      description: `删除游玩项目: ${project.name} (${project.code})`,
      oldData,
    });

    successResponse(res, null, '游玩项目删除成功');
  } catch (error) {
    console.error('Delete amusement project error:', error);
    errorResponse(res, '删除游玩项目失败', 500);
  }
};

const checkAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { height, age, idCard } = req.query;

    const project = await AmusementProject.findByPk(id);
    if (!project) {
      return errorResponse(res, '游玩项目不存在');
    }

    const visitor = {
      height: height === '' ? null : height,
      age: age === '' ? null : age,
      idCard: idCard === '' ? null : idCard,
    };

    const result = checkProjectAccess(project, visitor);

    successResponse(res, {
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        minHeight: project.minHeight,
        maxHeight: project.maxHeight,
        minAge: project.minAge,
        maxAge: project.maxAge,
        isCharged: project.isCharged,
        price: project.price,
      },
      visitor,
      ...result,
    });
  } catch (error) {
    console.error('Check access error:', error);
    errorResponse(res, '准入校验失败', 500);
  }
};

const checkAllAccess = async (req, res) => {
  try {
    const { height, age, idCard, visitorName } = req.query;

    const projects = await AmusementProject.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    const visitor = {
      height: height === '' ? null : height,
      age: age === '' ? null : age,
      idCard: idCard === '' ? null : idCard,
    };

    const accessible = [];
    const inaccessible = [];

    projects.forEach((project) => {
      const result = checkProjectAccess(project, visitor);
      const item = {
        id: project.id,
        name: project.name,
        code: project.code,
        category: project.category,
        location: project.location,
        isCharged: project.isCharged,
        price: project.price,
        minHeight: project.minHeight,
        maxHeight: project.maxHeight,
        minAge: project.minAge,
        maxAge: project.maxAge,
        accessible: result.accessible,
        reasons: result.reasons,
      };
      if (result.accessible) {
        accessible.push(item);
      } else {
        inaccessible.push(item);
      }
    });

    successResponse(res, {
      visitor: { ...visitor, name: visitorName || null },
      summary: {
        total: projects.length,
        accessibleCount: accessible.length,
        inaccessibleCount: inaccessible.length,
      },
      accessible,
      inaccessible,
    });
  } catch (error) {
    console.error('Check all access error:', error);
    errorResponse(res, '准入校验失败', 500);
  }
};

module.exports = {
  getAmusementProjects,
  getActiveAmusementProjects,
  getAmusementProjectDetail,
  createAmusementProject,
  updateAmusementProject,
  deleteAmusementProject,
  checkAccess,
  checkAllAccess,
};
