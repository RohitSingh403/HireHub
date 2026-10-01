import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PageHeader from "../../../components/PageHeader.jsx";
import Alert from "../../../components/Alert.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import { getCurrentUser, updateProfile } from "../../auth/services/authService.js";
import useAuthStore from "../../../store/authStore.js";
import apiError from "../../../utils/apiError.js";
import { formatLabel } from "../../../utils/format.js";

const workModes = ["remote", "hybrid", "onsite"];

function ProfileForm() {
  const setUser = useAuthStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [saved, setSaved] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      skills: "",
      yearsOfExperience: "0",
      preferredRole: "",
      location: "",
      workMode: "hybrid",
      salaryMin: "",
      salaryMax: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const user = await getCurrentUser();
        if (cancelled) {
          return;
        }
        reset({
          skills: (user.skills || []).join(", "),
          yearsOfExperience: String(user.yearsOfExperience ?? 0),
          preferredRole: user.preferredRole || "",
          location: user.location || "",
          workMode: user.workMode || "hybrid",
          salaryMin: user.salaryMin ?? "",
          salaryMax: user.salaryMax ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(apiError(err, "Could not load your profile."));
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
    setSaved("");
    const skills = data.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const yearsOfExperience = Number(data.yearsOfExperience);
    const salaryMin = Number(data.salaryMin);
    const salaryMax = Number(data.salaryMax);

    if (!skills.length) {
      setErrorMessage("Add at least one skill.");
      return;
    }
    if (!data.preferredRole.trim() || !data.location.trim()) {
      setErrorMessage("Preferred role and location are required.");
      return;
    }
    if (!Number.isFinite(yearsOfExperience) || yearsOfExperience < 0) {
      setErrorMessage("Years of experience cannot be negative.");
      return;
    }
    if (
      !Number.isFinite(salaryMin) ||
      salaryMin < 0 ||
      !Number.isFinite(salaryMax) ||
      salaryMax < salaryMin
    ) {
      setErrorMessage("Salary maximum must be at least the minimum.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await updateProfile({
        skills,
        yearsOfExperience,
        preferredRole: data.preferredRole.trim(),
        location: data.location.trim(),
        workMode: data.workMode,
        salaryMin,
        salaryMax,
      });
      setUser(response.user);
      setSaved("Profile saved. Recommended roles use this profile.");
    } catch (err) {
      setErrorMessage(apiError(err, "Could not save your profile."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Candidates"
        title="Your profile"
        text="Skills, years, city, work mode, and salary are the inputs to the match. Preferred role is saved with the profile and is not part of the score."
      />
      {loading ? <p className="text-muted">Loading profile…</p> : null}
      {!loading ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid max-w-3xl gap-4 rounded-3xl border border-line bg-card p-5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2 flex flex-col gap-3">
            <Alert>{errorMessage}</Alert>
            <Alert tone="success">{saved}</Alert>
          </div>
          <div className="sm:col-span-2">
            <Field label="Preferred role" htmlFor="preferredRole">
              <input id="preferredRole" className={inputClass} {...register("preferredRole")} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Skills" htmlFor="skills">
              <input
                id="skills"
                className={inputClass}
                placeholder="React, CSS"
                {...register("skills")}
              />
            </Field>
          </div>
          <Field label="Years of experience" htmlFor="yearsOfExperience">
            <input
              id="yearsOfExperience"
              type="number"
              min="0"
              step="1"
              className={inputClass}
              {...register("yearsOfExperience")}
            />
          </Field>
          <Field label="Location" htmlFor="location">
            <input id="location" className={inputClass} {...register("location")} />
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
          <Field label="Minimum salary" htmlFor="salaryMin">
            <input id="salaryMin" type="number" min="0" className={inputClass} {...register("salaryMin")} />
          </Field>
          <Field label="Maximum salary" htmlFor="salaryMax">
            <input id="salaryMax" type="number" min="0" className={inputClass} {...register("salaryMax")} />
          </Field>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export default ProfileForm;
