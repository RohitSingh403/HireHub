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

export default createCompany;
