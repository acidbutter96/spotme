"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import styles from "./styles.module.scss";

declare global {
  interface Window {
    PayPal?: {
      Donation?: {
        Button?: (options: unknown) => { render: (selector: string) => void };
      };
    };
  }
}

const PAYPAL_HOSTED_BUTTON_ID = "JAG4L5B2LXH3L";

export default function DonateButton() {
  const [sdkReady, setSdkReady] = useState(false);
  const buttonId = useMemo(() => "donate-button", []);

  useEffect(() => {
    if (!sdkReady) {
      return;
    }

    const containerSelector = `#${buttonId}`;
    const element = document.querySelector(containerSelector);
    if (!element) {
      return;
    }

    // Prevent double-render in React StrictMode/dev refreshes.
    if (element.childNodes.length > 0) {
      return;
    }

    window.PayPal?.Donation?.Button?.({
      env: "production",
      hosted_button_id: PAYPAL_HOSTED_BUTTON_ID,
      image: {
        src: "https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif",
        alt: "Donate with PayPal button",
        title: "PayPal - The safer, easier way to pay online!",
      },
    })?.render(containerSelector);
  }, [sdkReady, buttonId]);

  return (
    <div className={styles.container}>
      <div id={buttonId} className={styles.button} />
      <Script
        src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
        strategy="afterInteractive"
        charSet="UTF-8"
        onLoad={() => setSdkReady(true)}
      />
    </div>
  );
}
