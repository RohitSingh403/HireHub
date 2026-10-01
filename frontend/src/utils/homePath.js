export function homePath(role) {
  if (role === "admin") {
    return "/admin";
  }
  if (role === "recruiter") {
    return "/recruiter";
  }
  return "/home";
}
