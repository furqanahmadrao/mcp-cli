/**
 * Reusable Form Input Component
 * 
 * Generic form input field for text, number, boolean, and select inputs.
 * Includes validation and error display.
 */

export type InputType = 'text' | 'number' | 'boolean' | 'select' | 'password' | 'toggle' | 'checkbox';

/**
 * Form input field definition
 */
export interface FormInputField {
  name: string;
  label: string;
  type: InputType;
  value: string | number | boolean;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: (value: any) => string | undefined;
  description?: string;
}

/**
 * Form field definition (more flexible version for views)
 */
export interface FormField {
  id?: string;
  name?: string;
  label: string;
  type: InputType;
  value: string | number | boolean;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  validation?: (value: any) => string | undefined | null;
  description?: string;
}


/**
 * Render a single form input field
 */
export function renderFormInput(
  field: FormInputField,
  width: number = 50,
  selected: boolean = false,
  error?: string
): string[] {
  const lines: string[] = [];
  
  // Label with indicator
  const indicator = selected ? '► ' : '  ';
  const label = `${indicator}${field.label}:`;
  lines.push(label);
  
  // Input based on type
  switch (field.type) {
    case 'text':
    case 'password':
      const displayValue = field.type === 'password' 
        ? '*'.repeat(String(field.value).length)
        : field.value;
      const inputLine = `  │ ${displayValue}`;
      lines.push(inputLine.padEnd(width - 1) + '│');
      break;
    
    case 'number':
      lines.push(`  │ ${String(field.value)}`.padEnd(width - 1) + '│');
      break;
    
    case 'boolean':
      const boolValue = field.value ? '✓ Yes' : '○ No';
      lines.push(`  │ ${boolValue}`.padEnd(width - 1) + '│');
      break;
    
    case 'select':
      const selectedOption = field.options?.find(o => o.value === field.value);
      lines.push(`  │ ${selectedOption?.label || 'Select...'}`.padEnd(width - 1) + '│');
      break;
  }
  
  // Description if provided
  if (field.description) {
    lines.push(`  ℹ ${field.description}`);
  }
  
  // Error message if present
  if (error) {
    lines.push(`  ✕ ${error}`);
  }
  
  return lines;
}

/**
 * Render form with multiple fields
 */
export function renderFormFields(
  fields: FormInputField[],
  selectedIndex: number = 0,
  errors: Record<string, string> = {},
  width: number = 50
): string[] {
  const lines: string[] = [];
  
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const isSelected = i === selectedIndex;
    const error = errors[field.name];
    
    const fieldLines = renderFormInput(field, width, isSelected, error);
    lines.push(...fieldLines);
    
    // Separator between fields
    if (i < fields.length - 1) {
      lines.push('');
    }
  }
  
  return lines;
}

/**
 * Validate form fields
 */
export function validateFormFields(
  fields: FormInputField[]
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const field of fields) {
    // Check required
    if (field.required && !field.value) {
      errors[field.name] = 'This field is required';
      continue;
    }
    
    // Run custom validation
    if (field.validation) {
      const error = field.validation(field.value);
      if (error) {
        errors[field.name] = error;
      }
    }
  }
  
  return errors;
}

/**
 * Update form field value
 */
export function updateFormField(
  fields: FormInputField[],
  fieldName: string,
  newValue: any
): FormInputField[] {
  return fields.map(f => 
    f.name === fieldName ? { ...f, value: newValue } : f
  );
}

/**
 * Common validators
 */
export const validators = {
  required: (message = 'This field is required') => 
    (value: any) => !value ? message : undefined,
  
  minLength: (min: number) => 
    (value: any) => String(value).length < min ? `Minimum ${min} characters required` : undefined,
  
  maxLength: (max: number) => 
    (value: any) => String(value).length > max ? `Maximum ${max} characters allowed` : undefined,
  
  number: (value: any) => 
    isNaN(Number(value)) ? 'Must be a valid number' : undefined,
  
  positiveNumber: (value: any) => {
    if (isNaN(Number(value))) return 'Must be a valid number';
    if (Number(value) < 0) return 'Must be a positive number';
    return undefined;
  },
  
  port: (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return 'Must be a valid port number';
    if (num < 1 || num > 65535) return 'Port must be between 1 and 65535';
    return undefined;
  },
  
  email: (value: any) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !regex.test(String(value)) ? 'Must be a valid email address' : undefined;
  },
};

/**
 * Create a simple form
 */
export interface SimpleForm {
  title: string;
  fields: FormInputField[];
  onSubmit?: (values: Record<string, any>) => void;
  onCancel?: () => void;
}

/**
 * Get form values as object
 */
export function getFormValues(fields: FormInputField[]): Record<string, any> {
  const values: Record<string, any> = {};
  for (const field of fields) {
    values[field.name] = field.value;
  }
  return values;
}

/**
 * Alias for renderFormFields for backwards compatibility
 */
export function renderForm(
  fields: FormInputField[],
  selectedIndex: number = 0,
  errors: Record<string, string> = {},
  width: number = 50
): string[] {
  return renderFormFields(fields, selectedIndex, errors, width);
}

/**
 * Render form buttons (Save/Cancel)
 */
export function renderFormButtons(
  width: number = 50,
  selectedButton: 'save' | 'cancel' = 'save'
): string[] {
  const lines: string[] = [];
  
  const saveBtn = selectedButton === 'save' ? '► Save' : '  Save';
  const cancelBtn = selectedButton === 'cancel' ? '► Cancel' : '  Cancel';
  
  const buttonLine = `  ${saveBtn.padEnd(15)} ${cancelBtn.padEnd(15)}`;
  lines.push(buttonLine.padEnd(width - 2));
  
  return lines;
}
