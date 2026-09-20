import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

type NavDropdownItemProps = {
  children: any;
  to?: string;
  disabled?: boolean;
  onClick?: () => void;
  listClassName?: string;
  linkClassName?: string;
};

function NavDropdownItem(props: NavDropdownItemProps) {
  const router = useRouter();
  const disabled = !!props.disabled;
  const listClassName = props.listClassName ? props.listClassName : "";
  let linkClassName = props.linkClassName ? props.linkClassName : "";

  if (disabled) linkClassName += " disabled";

  if (!props.to) {
    return (
      <li className={listClassName}>
        <button type="button" onClick={props.onClick} className={`btn dropdown-item ${linkClassName}`}>
          {props.children}
        </button>
      </li>
    );
  }

  const isActive = router.pathname === props.to;
  return (
    <li className={listClassName}>
      <Link
        href={props.to}
        className={`dropdown-item ${linkClassName} ${isActive ? "active" : ""}`}
        onClick={props.onClick}
      >
        {props.children}
      </Link>
    </li>
  );
}

export default NavDropdownItem;
