/**
 * Legacy form `<Select>` — kept for back-compat, but it now renders the
 * non-native `SelectField` internally. New code should import `SelectField`
 * directly.
 */
import React from "react";
import SelectField, { type SelectOption } from "./SelectField";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
}) => {
  const opts: SelectOption[] = options.map((o) => ({
    value: o.value,
    label: o.label,
  }));
  return (
    <SelectField
      options={opts}
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={onChange}
      className={className}
    />
  );
};

export default Select;
