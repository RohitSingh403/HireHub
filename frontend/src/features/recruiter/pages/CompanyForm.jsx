import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import {
  createCompany,
  fetchMyCompany,
  updateCompany,
} from "../services/companyService.js";
import apiError from "../../../utils/apiError.js";

const emptyValues = {
  name: "",
  description: "",
  website: "",
  logo: "",
  location: "",
  industry: "",
  companySize: "",
};

function CompanyForm() {
  const navigate = useNavigate();
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues });
  const watched = watch();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const company = await fetchMyCompany();
        if (cancelled || !company) {
          return;
        }
        setCompanyId(company._id);
        reset({
          name: company.name,
          description: company.description,
          website: company.website,
          logo: company.logo,
          location: company.location,
          industry: company.industry,
          companySize: String(company.companySize),
        });
      } catch (err) {
        if (!cancelled && err?.response?.status !== 404) {
          setErrorMessage(apiError(err, "Could not load your company."));
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
  }, [reset]);

  async function onSubmit(data) {
    setErrorMessage("");
    const payload = {
      name: data.name.trim(),
      description: data.description.trim(),
      website: data.website.trim(),
      logo: data.logo.trim(),
      location: data.location.trim(),
      industry: data.industry.trim(),
      companySize: Number(data.companySize),
    };
    if (!payload.name || !payload.description || !payload.website || !payload.logo || !payload.location || !payload.industry) {
      setErrorMessage("Fill in every field.");
      return;
    }
    if (!Number.isInteger(payload.companySize) || payload.companySize < 1) {
      setErrorMessage("Company size must be at least 1.");
      return;
    }
    setSubmitting(true);
    try {
      if (companyId) {
        await updateCompany(companyId, payload);
      } else {
        await createCompany(payload);
      }
      navigate("/recruiter", { replace: true });
    } catch (err) {
      setErrorMessage(apiError(err, "Could not save the company."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Recruiters"
        title={companyId ? "Update company" : "Create company"}
        text="The owner is taken from your account. The form cannot assign the company to someone else."
      />
      {loading ? <p className="text-muted">Loading company…</p> : null}
      {!loading ? (
        <>
          <header className="mb-6 rounded-3xl border border-line bg-card p-6">
            <h2 className="font-display text-4xl">{watched.name || "Your company"}</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-muted">Website</dt>
                <dd className="mt-1 break-all">{watched.website || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-1">{watched.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Industry</dt>
                <dd className="mt-1">{watched.industry || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Size</dt>
                <dd className="mt-1">
                  {watched.companySize ? `${watched.companySize} people` : "—"}
                </dd>
              </div>
            </dl>
          </header>
          <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid max-w-3xl gap-4 rounded-3xl border border-line bg-card p-5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <Alert>{errorMessage}</Alert>
          </div>
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <input id="name" className={inputClass} {...register("name", { required: "Name is required" })} />
          </Field>
          <Field label="Industry" htmlFor="industry">
            <input id="industry" className={inputClass} {...register("industry")} placeholder="Software" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="description">
              <textarea id="description" rows={4} className={inputClass} {...register("description")} />
            </Field>
          </div>
          <Field label="Website" htmlFor="website">
            <input id="website" className={inputClass} {...register("website")} placeholder="https://" />
          </Field>
          <Field label="Logo URL" htmlFor="logo">
            <input id="logo" className={inputClass} {...register("logo")} placeholder="https://" />
          </Field>
          <Field label="Location" htmlFor="location">
            <input id="location" className={inputClass} {...register("location")} />
          </Field>
          <Field label="Company size" htmlFor="companySize">
            <input id="companySize" type="number" min="1" className={inputClass} {...register("companySize")} />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving…" : companyId ? "Save changes" : "Create company"}
            </button>
          </div>
          </form>
        </>
      ) : null}
    </div>
  );
}

export default CompanyForm;
