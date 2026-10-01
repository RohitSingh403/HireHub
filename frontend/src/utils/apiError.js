function apiError(err, fallback = "Something went wrong. Try again.") {
  return (
    err?.response?.data?.msg ||
    err?.response?.data?.error ||
    err?.response?.data?.err ||
    fallback
  );
}

export default apiError;
