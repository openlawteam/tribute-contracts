import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

const FeatureList = [
  {
    title: "Modular",
    Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    description: (
      <>
        TributeDAO Framework is designed to easily assemble a DAO like lego
        blocks, by using a narrowly-defined, tested, and extensible smart
        contracts.
      </>
    ),
  },
  {
    title: "Low Cost",
    Svg: require("../../static/img/undraw_docusaurus_tree.svg").default,
    description: (
      <>
        TributeDAO Framework enables low cost deployments due to its design and
        architecture based on Clone Factory pattern.
      </>
    ),
  },
  {
    title: "Extensible",
    Svg: require("../../static/img/undraw_docusaurus_react.svg").default,
    description: (
      <>
        TributeDAO Framework enables the creation of custom extensions to
        isolate the complexity of DAO core contract, and enhance it with new
        features.
      </>
    ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
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
    <section className={styles.features}>
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
