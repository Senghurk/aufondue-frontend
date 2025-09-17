import React from "react";
import { Button as ShadcnButton } from "../../components/ui/button";

export const Button = ({ children, className = "", ...props }) => {
  return (
    <ShadcnButton
      className={className}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
};
