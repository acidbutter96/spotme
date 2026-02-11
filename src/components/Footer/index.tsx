import Image from "next/image";
import Link from "next/link";
import styles from "./styles.module.scss";

const Footer = (): React.JSX.Element => {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.container}>
      <div className={styles.textRow}>
        Copyright &copy; {year}. Spotme All Rights Reserved. | Developed By{" "}
        <Link href="https://devbutter.tech" target="_blank" rel="noopener noreferrer">
          <span>
            <Image
              src="/icons/devbutter.svg"
              height={0}
              width={0}
              alt="devbutter"
            />
          </span>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
