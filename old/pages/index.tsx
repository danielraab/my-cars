import { faCopyright, faGasPump, faHouse, faTrafficLight, faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import useAuth from "../hooks/use-auth";
import styles from "../styles/Home.module.css";

export default function Home() {
  const { currentAuth } = useAuth();
  function linkOrLogin(link: string) {
    if (currentAuth) return link;
    else return "/auth/login";
  }
  const cartColorClass = (color: string) => (currentAuth ? color : "text-muted");
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className="text-primary">My Car</span> App
        </h1>

        {!currentAuth && (
          <p className={styles.description}>
            Get started by <Link href="/auth/login">login</Link> or <Link href="/auth/register">register</Link> now
            account.
          </p>
        )}

        <div className={styles.grid}>
          <Link href={linkOrLogin("/home")} className={`${styles.card} ${cartColorClass("text-primary")}`}>
            <FontAwesomeIcon icon={faHouse} className="mb-3" />
            <h2>Expenses</h2>
            <p>Overview of all expenses.</p>
          </Link>

          <Link href={linkOrLogin("/refuels")} className={`${styles.card} ${cartColorClass("text-success")}`}>
            <FontAwesomeIcon icon={faGasPump} className="mb-3" />
            <h2>Refuels</h2>
            <p>Keep track of your refuels.</p>
          </Link>

          <Link href={linkOrLogin("/repairs")} className={`${styles.card} ${cartColorClass("text-danger")}`}>
            <FontAwesomeIcon icon={faWrench} className="mb-3" />
            <h2>Repairs</h2>
            <p>Keep track of your repairs.</p>
          </Link>

          <Link href={linkOrLogin("/tickets")} className={`${styles.card} ${cartColorClass("text-warning")}`}>
            <FontAwesomeIcon icon={faTrafficLight} className="mb-3" />
            <h2>Tickets</h2>
            <p>Keep track of your tickets.</p>
          </Link>
        </div>
      </main>
      <footer className="d-flex border-top justify-content-center p-4 mt-auto">
        <p>
          <FontAwesomeIcon icon={faCopyright} />{" "}
          <a href="https://softdev.at" className="d-inline">
            Daniel Raab
          </a>
        </p>
      </footer>
    </div>
  );
}
