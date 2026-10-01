const WEIGHTS = {
  skills: 50,
  experience: 20,
  location: 15,
  salary: 15,
};

function cleanSkill(value) {
  return String(value ?? "").trim();
}

function uniqueSkills(values) {
  const seen = new Set();
  const skills = [];
  for (const value of Array.isArray(values) ? values : []) {
    const label = cleanSkill(value);
    const key = label.toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    skills.push(label);
  }
  return skills;
}

function numeric(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sameCity(left, right) {
  const a = String(left ?? "").trim().toLowerCase();
  const b = String(right ?? "").trim().toLowerCase();
  return a.length > 0 && a === b;
}

function scoreSkills(profile, job) {
  const required = uniqueSkills(job?.skills);
  if (required.length === 0) {
    return null;
  }
  const owned = new Set(
    uniqueSkills(profile?.skills).map((skill) => skill.toLowerCase()),
  );
  const matched = required.filter((skill) => owned.has(skill.toLowerCase()));
  const missing = required.filter((skill) => !owned.has(skill.toLowerCase()));
  const score = (matched.length / required.length) * 100;
  return {
    score,
    weight: WEIGHTS.skills,
    matched,
    missing,
    reason: `${matched.length} of ${required.length} required skills. Extra skills are not counted.`,
  };
}

function scoreExperience(profile, job) {
  const years = numeric(profile?.yearsOfExperience);
  const minimum = numeric(job?.experienceMin) ?? 0;
  const candidateYears = years === null ? 0 : years;
  let score = 0;
  let reason = "Years of experience are missing.";

  if (candidateYears >= minimum) {
    score = 100;
    reason =
      minimum === 0
        ? "No minimum years are required."
        : `Meets the minimum of ${minimum} years.`;
  } else if (minimum > 0) {
    score = (candidateYears / minimum) * 100;
    reason = `${candidateYears} of ${minimum} required years.`;
  }

  return {
    score,
    weight: WEIGHTS.experience,
    candidateYears,
    requiredYears: minimum,
    reason,
  };
}

function scoreLocation(profile, job) {
  const candidateMode = String(profile?.workMode ?? "").trim().toLowerCase();
  const jobMode = String(job?.workMode ?? "").trim().toLowerCase();

  if (candidateMode === "remote" && jobMode === "onsite") {
    return {
      score: 0,
      weight: WEIGHTS.location,
      reason: "You want remote work and this role is onsite.",
    };
  }

  if (jobMode === "remote") {
    return {
      score: 100,
      weight: WEIGHTS.location,
      reason: "This role is remote.",
    };
  }

  if (sameCity(profile?.location, job?.location)) {
    return {
      score: 100,
      weight: WEIGHTS.location,
      reason: "The city matches.",
    };
  }

  return {
    score: 0,
    weight: WEIGHTS.location,
    reason: "The city does not match.",
  };
}

function rangesOverlap(leftMin, leftMax, rightMin, rightMax) {
  const bounds = [leftMin, leftMax, rightMin, rightMax];
  if (bounds.some((value) => value === null)) {
    return false;
  }
  return leftMin <= rightMax && rightMin <= leftMax;
}

function scoreSalary(profile, job) {
  const overlap = rangesOverlap(
    numeric(profile?.salaryMin),
    numeric(profile?.salaryMax),
    numeric(job?.salaryMin),
    numeric(job?.salaryMax),
  );
  return {
    score: overlap ? 100 : 0,
    weight: WEIGHTS.salary,
    reason: overlap
      ? "The salary ranges overlap."
      : "The salary ranges do not overlap.",
  };
}

function scoreMatch(profile, job) {
  const skills = scoreSkills(profile, job);
  if (!skills) {
    return null;
  }
  const experience = scoreExperience(profile, job);
  const location = scoreLocation(profile, job);
  const salary = scoreSalary(profile, job);
  const overall = Math.round(
    (skills.score * skills.weight +
      experience.score * experience.weight +
      location.score * location.weight +
      salary.score * salary.weight) /
      100,
  );

  return {
    overall,
    skills,
    experience,
    location,
    salary,
  };
}

export { WEIGHTS, scoreMatch };
