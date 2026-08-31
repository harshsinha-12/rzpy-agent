import {
  landingSections,
  operatingLayers,
  recoveryScenarios,
} from "../content";
import styles from "./landing.module.css";

export function OperatingModel() {
  return (
    <section
      aria-labelledby="operating-model-title"
      className={styles.operatingSection}
    >
      <div className={styles.scenarioRail} aria-label="Recovery scenarios">
        <div className={styles.scenarioTrack}>
          {[...recoveryScenarios, ...recoveryScenarios].map(
            (scenario, index) => (
              <span
                aria-hidden={index >= recoveryScenarios.length}
                key={`${scenario}-${index}`}
              >
                {scenario}
              </span>
            ),
          )}
        </div>
      </div>

      <div className={styles.operatingHeading}>
        <div>
          <p className={styles.sectionEyebrow}>
            {landingSections.operatingModel.eyebrow}
          </p>
          <h2 id="operating-model-title">
            {landingSections.operatingModel.title}
          </h2>
        </div>
        <p>{landingSections.operatingModel.intro}</p>
      </div>

      <ol className={styles.operatingLayers}>
        {operatingLayers.map((layer) => (
          <li key={layer.index}>
            <div className={styles.layerTopline}>
              <span>{layer.index}</span>
              <small>{layer.label}</small>
            </div>
            <div className={styles.layerPulse} aria-hidden="true">
              <span />
            </div>
            <h3>{layer.title}</h3>
            <p>{layer.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
