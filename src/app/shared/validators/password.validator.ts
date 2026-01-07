import { AbstractControl, ValidationErrors } from '@angular/forms';

export function strongPasswordValidator(
  control: AbstractControl
): ValidationErrors | null {
  const value = control.value || '';

  if (value.length < 10) {
    return { minLength: true };
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(value);

  if (!hasUppercase && !hasSpecialChar) {
    return { strength: true };
  }

  return null;
}
