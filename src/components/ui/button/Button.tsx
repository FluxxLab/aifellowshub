import React, { ReactNode } from "react";

interface ButtonProps {
 children: ReactNode;
 size?:"sm"|"md";
 variant?:"primary"|"outline"|"fellowship";
 startIcon?: ReactNode;
 endIcon?: ReactNode;
 onClick?: () => void;
 type?:"button"|"submit"|"reset";
 disabled?: boolean;
 className?: string;
}

const Button: React.FC<ButtonProps> = ({
 children,
 size ="md",
 variant ="primary",
 startIcon,
 endIcon,
 onClick,
 type ="button",
 className ="",
 disabled = false,
}) => {
 // Size Classes
 const sizeClasses = {
 sm:"px-4 py-3 text-sm",
 md:"px-5 py-3.5 text-sm",
 };

 // Variant Classes
 const variantClasses = {
 primary:"bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
 outline:"bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
 fellowship:"bg-warning-400 text-fellowship-navy shadow-theme-xs hover:bg-warning-500 disabled:bg-warning-200 disabled:text-fellowship-navy/60",
 };

 return (
 <button
 type={type}
 className={`inline-flex items-center justify-center font-semibold gap-2 rounded-lg transition ${className} ${
 sizeClasses[size]
 } ${variantClasses[variant]} ${
 disabled ?"cursor-not-allowed opacity-50":""}`}
 onClick={onClick}
 disabled={disabled}
 >
 {startIcon && <span className="flex items-center">{startIcon}</span>}
 {children}
 {endIcon && <span className="flex items-center">{endIcon}</span>}
 </button>
 );
};

export default Button;
