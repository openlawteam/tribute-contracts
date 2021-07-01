import React from "react";
import HomepageFeatures from "../components/HomepageFeatures";
import HomepageHero from "../components/HomepageHero";
import HomepageFooter from "../components/HomepageFooter";

export default function Home() {
  return (
    <>
      <main>
        <HomepageHero />
        <HomepageFeatures />
      </main>
      <HomepageFooter />
    </>
  );
}
