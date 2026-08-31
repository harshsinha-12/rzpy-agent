import Link from "next/link";

import {
  finalCallToAction,
  landingHero,
  landingSections,
  productDifference,
  recoveryLoopStages,
} from "../content";
import { HeroProductPreview } from "./hero-product-preview";
import styles from "./landing.module.css";
import { OperatingModel } from "./operating-model";
import { ProductSurfaces } from "./product-surfaces";
import { ProofBoundary } from "./proof-boundary";

export function LandingPage() {
  return (
    <div className={styles.page}>
      <section aria-labelledby="landing-title" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>{landingHero.eyebrow}</p>
          <h1 className={styles.heroTitle} id="landing-title">
            {landingHero.problemLead}
            <span> {landingHero.problemEmphasis}</span>
          </h1>
          <p className={styles.promise}>{landingHero.promise}</p>
          <div className={styles.ctaRow}>
            <Link className={styles.ctaPrimary} href="/dashboard">
              {landingHero.ctaPrimary}
            </Link>
            <Link className={styles.ctaSecondary} href="/demo/checkout">
              {landingHero.ctaSecondary}
            </Link>
          </div>
          <ul aria-label="Product principles" className={styles.trustList}>
            {landingHero.trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <HeroProductPreview />
      </section>

      <section
        aria-labelledby="difference-title"
        className={styles.differenceSection}
      >
        <div className={styles.differenceLead}>
          <p className={styles.sectionEyebrow}>
            {landingSections.difference.eyebrow}
          </p>
          <h2 id="difference-title">{landingSections.difference.title}</h2>
        </div>
        <div className={styles.differenceGrid}>
          {productDifference.map((item) => (
            <article key={item.index}>
              <span>{item.index}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how-it-works-title" className={styles.section}>
        <div className={styles.sectionHeadingRow}>
          <div>
            <p className={styles.sectionEyebrow}>
              {landingSections.howItWorks.eyebrow}
            </p>
            <h2 className={styles.sectionTitle} id="how-it-works-title">
              {landingSections.howItWorks.title}
            </h2>
          </div>
          <p className={styles.sectionIntro}>
            {landingSections.howItWorks.intro}
          </p>
        </div>
        <ol className={styles.loopList}>
          {recoveryLoopStages.map((stage) => (
            <li className={styles.loopItem} key={stage.index}>
              <div className={styles.loopIndexRow}>
                <span>{stage.index}</span>
                <small>{stage.owner}</small>
              </div>
              <strong>{stage.title}</strong>
              <p>{stage.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <OperatingModel />

      <ProductSurfaces />

      <ProofBoundary />

      <section aria-labelledby="final-cta" className={styles.finalCta}>
        <div>
          <p className={styles.finalCtaEyebrow}>{finalCallToAction.eyebrow}</p>
          <h2 id="final-cta">{finalCallToAction.title}</h2>
          <p>{finalCallToAction.body}</p>
        </div>
        <div className={styles.finalCtaActions}>
          <Link className={styles.ctaHighlight} href="/dashboard">
            {finalCallToAction.primary}
          </Link>
          <Link className={styles.ctaOnDark} href="/about">
            {finalCallToAction.secondary}
          </Link>
        </div>
      </section>
    </div>
  );
}
