function requireEnvironmentVariable(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(name + " is required. Add it to backend/.env for local development or to your cloud service environment variables.");
  }
  return String(value).trim();
}

module.exports = { requireEnvironmentVariable };
