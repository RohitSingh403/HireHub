import Company from "../models/Company.js";

async function createCompany(req, res) {
  try {
    const {
      name,
      description,
      website,
      logo,
      location,
      industry,
      companySize,
    } = req.body;
    if (
      !name ||
      !description ||
      !website ||
      !logo ||
      !location ||
      !industry ||
      !companySize
    ) {
      return res.status(400).json({
        error: "Required fields are missing",
      });
    }

    const newCompany = await Company.create({
      name,
      description,
      website,
      logo,
      location,
      industry,
      companySize,
      owner: req.user.userId,
    });

    return res.status(201).json({
      msg: "Company created successfully",
      company: newCompany,
    });
  } catch (err) {
    return res.status(500).json({
      msg: "Internal server error",
    });
  }
}

async function getCompanyById(req, res) {
  const companyId = req.params.id;

  const existCompany = await Company.findById(companyId);

  if (!existCompany) {
    return res.status(404).json({
      msg: "Company not found",
    });
  }

  return res.status(200).json({
    msg: "Company found successfully",
    company: existCompany,
  });
}

async function updateCompany(req, res) {
  const companyId = req.params.id;
  const recruiterId = req.user.userId;

  const existCompany = await Company.findById(companyId);
  if (!existCompany) {
    return res.status(404).json({
      msg: "Company not found",
    });
  }

  if (existCompany.owner.toString() !== recruiterId) {
    return res.status(403).json({
      msg: "Access denied",
    });
  }

  const companyUpdate = {};

  if (req.body.name !== undefined) {
    companyUpdate.name = req.body.name;
  }

  if (req.body.description !== undefined) {
    companyUpdate.description = req.body.description;
  }

  if (req.body.website !== undefined) {
    companyUpdate.website = req.body.website;
  }

  if (req.body.logo !== undefined) {
    companyUpdate.logo = req.body.logo;
  }

  if (req.body.location !== undefined) {
    companyUpdate.location = req.body.location;
  }

  if (req.body.industry !== undefined) {
    companyUpdate.industry = req.body.industry;
  }

  if (req.body.companySize !== undefined) {
    companyUpdate.companySize = req.body.companySize;
  }

  if (Object.keys(companyUpdate).length === 0) {
    return res.status(400).json({
      msg: "At least one field is required to update the company",
    });
  }

  const patchCompany = await Company.findByIdAndUpdate(
    companyId,
    companyUpdate,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    msg: "Company updated successfully",
    company: patchCompany,
  });
}

export { createCompany, getCompanyById, updateCompany };
