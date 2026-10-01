import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import { fetchMyCompany } from "../services/companyService.js";
import { createJob, fetchJob, updateJob } from "../../jobs/services/jobService.js";
import apiError from "../../../utils/apiError.js";
import { formatLabel } from "../../../utils/format.js";

const employmentTypes = ["full-time", "part-time", "contract", "internship"];
const workModes = ["remote", "hybrid", "onsite"];
const createStatuses = ["open", "draft"];
const editStatuses = ["open", "draft", "closed"];

const emptyValues = {
  title: "",
  description: "",
  location: "",
  employmentType: "full-time",
  workMode: "hybrid",
  salaryMin: "",
  salaryMax: "",
  skills: "",
  experience: "",
  experienceMin: "0",
  status: "open",
};

function JobForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyValues });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const mine = await fetchMyCompany();
        if (cancelled) {
          return;
        }
        setCompany(mine);
        if (isEdit) {
          const job = await fetchJob(id);
          if (cancelled) {
            return;
          }
          reset({
            title: job.title,
            description: job.description,
            location: job.location,
            employmentType: job.employmentType,
            workMode: job.workMode,
            salaryMin: String(job.salaryMin),
            salaryMax: String(job.salaryMax),
            skills: (job.skills || []).join(", "),
            experience: job.experience,
            experienceMin: String(job.experienceMin ?? 0),
            status: job.status,
          });
        }
      } catch (err) {
        if (!cancelled && err?.response?.status !== 404) {
          setErrorMessage(apiError(err, "Could not load the form."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset]);

  async function onSubmit(data) {
    setErrorMessage("");
    const salaryMin = Number(data.salaryMin);
    const salaryMax = Number(data.salaryMax);
    const experienceMin = data.experienceMin === "" ? 0 : Number(data.experienceMin);
    const skills = data.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!data.title.trim() || !data.description.trim() || !data.location.trim() || !data.experience.trim()) {
      setErrorMessage("Title, description, location, and experience are required.");
      return;
    }
    if (!skills.length) {
      setErrorMessage("Add at least one skill.");
      return;
    }
    if (Number.isNaN(salaryMin) || salaryMin < 0) {
      setErrorMessage("Minimum salary must be zero or more.");
      return;
    }
    if (Number.isNaN(salaryMax) || salaryMax < salaryMin) {
      setErrorMessage("Maximum salary must be at least the minimum.");
      return;
    }
    if (!Number.isFinite(experienceMin) || experienceMin < 0) {
      setErrorMessage("Minimum years cannot be negative.");
      return;
    }
    if (!company?._id) {
      setErrorMessage("Create a company before posting a job.");
      return;
    }

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      location: data.location.trim(),
      employmentType: data.employmentType,
      workMode: data.workMode,
      salaryMin,
      salaryMax,
      skills,
      experience: data.experience.trim(),
      experienceMin,
      status: data.status,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateJob(id, payload);
      } else {
        await createJob({ ...payload, company: company._id });
      }
      navigate("/recruiter", { replace: true });
    } catch (err) {
      setErrorMessage(apiError(err, "Could not save the job."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiters"
        title={isEdit ? "Edit job" : "Post a job"}
        text="Employment type is full-time, part-time, contract, or internship. Work mode is remote, hybrid, or onsite. They stay separate."
      />
      {loading ? <p className="text-muted">Loading…</p> : null}
      {!loading && !company ? (
        <div className="rounded-3xl border border-line bg-card p-6">
          <p className="font-display text-2xl">Create your company first</p>
          <Link to="/recruiter/company" className="mt-3 inline-block text-sm font-semibold text-pine">
            Go to company
          </Link>
        </div>
      ) : null}
      {!loading && company ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid max-w-3xl gap-6"
        >
          <Alert>{errorMessage}</Alert>
          <p className="text-sm text-muted">
            Posting for <span className="font-medium text-ink">{company.name}</span>
          </p>

          <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="font-display text-2xl">Overview</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Title" htmlFor="title">
                  <input id="title" className={inputClass} {...register("title")} />
                </Field>
              </div>
              <Field label="Location" htmlFor="location">
                <input id="location" className={inputClass} {...register("location")} />
              </Field>
              <Field label="Status" htmlFor="status">
                <select id="status" className={inputClass} {...register("status")}>
                  {(isEdit ? editStatuses : createStatuses).map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Employment type" htmlFor="employmentType">
                <select id="employmentType" className={inputClass} {...register("employmentType")}>
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatLabel(type)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Work mode" htmlFor="workMode">
                <select id="workMode" className={inputClass} {...register("workMode")}>
                  {workModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {formatLabel(mode)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="font-display text-2xl">Compensation and experience</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Minimum salary" htmlFor="salaryMin">
                <input id="salaryMin" type="number" min="0" className={inputClass} {...register("salaryMin")} />
              </Field>
              <Field label="Maximum salary" htmlFor="salaryMax">
                <input id="salaryMax" type="number" min="0" className={inputClass} {...register("salaryMax")} />
              </Field>
              <Field label="Experience" htmlFor="experience">
                <input id="experience" className={inputClass} {...register("experience")} placeholder="2+ years" />
              </Field>
              <Field label="Minimum years" htmlFor="experienceMin">
                <input
                  id="experienceMin"
                  type="number"
                  min="0"
                  className={inputClass}
                  {...register("experienceMin")}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="font-display text-2xl">Skills and description</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Skills" htmlFor="skills">
                <input
                  id="skills"
                  className={inputClass}
                  placeholder="React, Node.js"
                  {...register("skills")}
                />
              </Field>
              <Field label="Description" htmlFor="description">
                <textarea id="description" rows={6} className={inputClass} {...register("description")} />
              </Field>
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving…" : isEdit ? "Save job" : "Publish job"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export default JobForm;
