const rules = {
  email: (value) => {
    if (!value) return false;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(value);
  },
  
  otp: (value) => {
    if (!value) return false;
    const regex = /^[0-9]{6}$/; // 6-digit OTP
    return regex.test(value);
  },
  token: (value) => {
    return typeof value === "string" && value.trim() !== "";
  },
  name: (value) => {
    return typeof value === "string" && value.trim().length >= 2;
  },
  password: (value) => {
    return typeof value === "string" && value.length >= 6;
  },
  // Add more custom validation rules here
};

/**
 * General validator
 * @param {object} input - { email, otp, token1, name, etc. }
 * @returns {object} - { valid: boolean, errors: { field: message } }
 */
export const validateInput = (input) => {
  const errors = {};
  for (const field in input) {
    const rule = rules[field];
    if (rule) {
      const isValid = rule(input[field]);
      if (!isValid) {
        errors[field] = `${field} is invalid`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
