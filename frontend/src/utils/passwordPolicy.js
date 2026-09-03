/**
 * Password Policy Helper
 * Centralized evaluation of strong password criteria.
 */

export function checkPasswordRequirements(password = "") {
  const str = String(password);

  const length = str.length >= 8 && str.length <= 25;
  const uppercase = /[A-Z]/.test(str);
  const lowercase = /[a-z]/.test(str);
  const number = /\d/.test(str);
  const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(str);

  const isValid = length && uppercase && lowercase && number && special;

  return {
    length,
    uppercase,
    lowercase,
    number,
    special,
    isValid,
  };
}
