
import React from "react";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";

interface FormInputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  isPassword?: boolean;
  showPassword?: boolean;
  toggleShowPassword?: () => void;
}

const FormInput = ({
  id,
  label,
  type,
  value,
  onChange,
  error,
  disabled = false,
  placeholder,
  isPassword = false,
  showPassword = false,
  toggleShowPassword,
}: FormInputProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          disabled={disabled}
          className={error ? `border-destructive ${isPassword ? "pr-10" : ""}` : isPassword ? "pr-10" : ""}
        />
        {isPassword && toggleShowPassword && (
          <button
            type="button"
            onClick={toggleShowPassword}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <div className="text-sm text-destructive flex items-center gap-1 mt-1">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {isPassword && !error && (
        <div className="text-xs text-muted-foreground">
          Password must be at least 8 characters with uppercase, lowercase, number, and special character
        </div>
      )}
    </div>
  );
};

export default FormInput;
