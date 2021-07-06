import React, { ReactNode } from "react";

// interface WrapProps {
//   children: ReactNode;
//   className?: string;
// }

const Wrap = (
  { children, ...rest } // : WrapProps & React.HTMLAttributes<HTMLDivElement>
) => (
  <div style={{ position: "relative" }} {...rest}>
    {children}
  </div>
);

export default Wrap;
