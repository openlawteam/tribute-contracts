import React from "react";

// interface LogoProps {
//   size?: "small" | "medium" | "large" | "";
// }

export default function Logo(props) {
  // LogoProps
  return (
    <div className={`logo ${props.size ? `logo--${props.size}` : ""}`}>
      TRIBUTE
    </div>
  );
}

/**
 * ModalLogo
 * This component is used for modal menu
 */
export function ModalLogo() {
  return (
    <div className="logo-container logo-container--center">
      <Logo size="small" />
    </div>
  );
}

/**
 * LeftLogo
 * This component is used for main pages
 */
export function LeftLogo() {
  return (
    <div className="logo-container logo-container--header">
      <Logo size="medium" />
    </div>
  );
}

/**
 * CenterLogo
 * This component is used for splash page
 */
export function CenterLogo() {
  return (
    <div className="logo-container logo-container--center">
      <Logo size="large" />
    </div>
  );
}
