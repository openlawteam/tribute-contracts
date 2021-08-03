import React from "react";
import clsx from "clsx";

const FeatureList = [
  {
    title: "Modular",
    // Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    imgPath: require("../../static/img/modular.png").default,
    description: (
      <>
        Designed to make DAO's easy to assemble, like lego blocks, utilizing a
        narrowly-defined, tested, and extensible set smart contracts.
      </>
    ),
  },
  {
    title: "Low Cost",
    // Svg: require("../../static/img/undraw_docusaurus_tree.svg").default,
    imgPath: require("../../static/img/lowcost.png").default,
    description: (
      <>
        TributeDAO Framework enables low cost deployments due to its design and
        architecture based on Clone Factory pattern.
      </>
    ),
  },
  {
    title: "Extensible",
    // Svg: require("../../static/img/undraw_docusaurus_react.svg").default,
    imgPath: require("../../static/img/extensible.png").default,
    description: (
      <>
        Custom extensions isolate the complexity of DAO core contracts and
        enable enhancements of it with new features.
      </>
    ),
  },
];

function Feature({ imgPath, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img src={imgPath} className="landing-features__img" alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className="landing-features">
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
