"use client";

import Background from "@devbutter/paint-background";
import styles from "./styles.module.scss";

export default function BackgroundClient() {
  return (
    <div aria-hidden="true" className={styles.container}>
      <Background colors={["#141628", "#1B1E32", "#F64C6F", "#04D361"]} />
    </div>
  );
}
