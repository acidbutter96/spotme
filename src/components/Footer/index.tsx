import Image from "next/image";
import Link from "next/link";
import DonateButton from "./DonateButton";
import styles from "./styles.module.scss";

const Footer = (): React.JSX.Element => {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.container}>
      <div className={`app-container ${styles.inner}`}>
        <div className={styles.textRow}>
          <span>Copyright &copy; {year}. Spotme All Rights Reserved.</span>
          <span className={styles.separator} aria-hidden="true">
            |
          </span>
          <span className={styles.developer}>
            Developed by{" "}
            <Link
              href="https://devbutter.tech"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.devLink}
            >
              <Image
                src="/icons/devbutter.svg"
                width={110}
                height={32}
                alt="devbutter"
                className={styles.devLogo}
              />
            </Link>
          </span>
        </div>

        <DonateButton />
      </div>
    </footer>
  );
};

export default Footer;
