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

export { createCompany, getCompanyById };
