import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

type NavLinkProps = {
  children: any;
  to?: string;
  disabled?: boolean;
  onClick?: () => void;
  listClassName?: string;
  linkClassName?: string;
};

function NavLink(props: NavLinkProps) {
  const router = useRouter();
  const disabled = !!props.disabled;
  const listClassName = props.listClassName ? props.listClassName : "";
  let linkClassName = props.linkClassName ? props.linkClassName : "";

  if (disabled) linkClassName += " disabled";

  if (!props.to) {
    return (
      <li className={`nav-item mx-auto ${listClassName}`}>
        <button type="button" onClick={props.onClick} className={`btn nav-link ${linkClassName}`}>
          <span data-bs-toggle="collapse" data-bs-target=".navbar-collapse.show">
            {props.children}
          </span>
        </button>
      </li>
    );
  }

  const isActive = router.pathname === props.to;

  return (
    <li className={`nav-item mx-auto ${listClassName}`}>
      <Link
        href={props.to}
        className={`nav-link px-2 ${linkClassName} ${isActive ? "active" : ""}`}
        onClick={props.onClick}
      >
        <span data-bs-toggle="collapse" data-bs-target=".navbar-collapse.show">
          {props.children}
        </span>
      </Link>
    </li>
  );
}

export default NavLink;
