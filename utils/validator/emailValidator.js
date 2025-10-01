const allowedDomains = [
  "nitkkr.ac.in"
];

// ✅ Helper function
function isValidInstituteEmail(email) {
  const domain = email.split("@").pop();
  return allowedDomains.includes(domain);
}

export { isValidInstituteEmail };