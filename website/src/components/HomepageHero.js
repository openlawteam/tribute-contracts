import React, { memo, useEffect } from "react";
import { useHistory } from "react-router-dom";
import Link from "@docusaurus/Link";
import AOS from "aos";
import "../../node_modules/aos/dist/aos.css";

import { CenterLogo } from "../components/Logo";
import FadeIn from "../components/common/FadeIn";
import SocialMedia from "../components/common/SocialMedia";
import Wrap from "../components/common/Wrap";

const TributeCube = memo(() => {
  return (
    <div
      className="cube"
      data-testid="cube"
      data-aos="fade-up"
      data-aos-delay="150"
    >
      <div className="cube__segment--top"></div>
      <div className="cube__segment--left"></div>
      <div className="cube__segment--right"></div>
    </div>
  );
});

function HomepageNavigation() {
  return (
    <nav role="navigation" id="navigation">
      <ul className="nav__list" data-testid="nav__list">
        <li tabIndex={0}>
          <Link to="/docs/tutorial/dao/installation">
            <span>Get Started</span>
          </Link>
        </li>
        <li tabIndex={0}>
          <Link to="/docs/intro/design/core/introduction">
            <span>Core</span>
          </Link>
        </li>
        <li tabIndex={0}>
          <Link to="/docs/intro/design/extensions/introduction">
            <span>Extensions</span>
          </Link>
        </li>
        <li tabIndex={0}>
          <Link to="/docs/intro/design/adapters/introduction">
            <span>Adapters</span>
          </Link>
        </li>
        <li tabIndex={0}>
          <Link to="https://demo.tributedao.com">
            <span>Demo</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

function GetStartedHeader() {
  return (
    <div className="landing__header nav-header__menu-container">
      <HomepageNavigation />
      <SocialMedia />
    </div>
  );
}

export default function HomepageHero() {
  /**
   * Their hooks
   */

  const history = useHistory();

  /**
   * Effects
   */

  useEffect(() => {
    AOS.init({
      duration: 800,
      offset: 40,
      delay: 120,
      mirror: false,
      once: true,
    });
  }, []);

  /**
   * Render
   */

  return (
    <>
      <GetStartedHeader />
      <Wrap className="section-wrapper" style={{ marginBottom: "2rem" }}>
        <FadeIn>
          <CenterLogo />
          <div className="landing">
            <div className="landing__subtitle">
              A next generation DAO framework
            </div>

            <div className="landing__img">
              <TributeCube />
            </div>

            <div className="landing__button">
              <button
                className="button"
                onClick={() => {
                  history.push("./docs/tutorial/dao/installation");
                }}
              >
                get started
                {/* launch your DAO Tutorial - 5 mins */}
              </button>
            </div>
          </div>
        </FadeIn>
      </Wrap>
    </>
  );
}
