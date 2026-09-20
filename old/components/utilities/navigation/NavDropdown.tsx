import React from "react";

type NavDropdownProps = {
  title: any;
  children: any;
  disabled?: boolean;
  onClick?: () => void;
  listClassName?: string;
  subListClassName?: string;
  linkClassName?: string;
};

function NavDropdown(props: NavDropdownProps) {
  const disabled = !!props.disabled;
  const listClassName = props.listClassName ? props.listClassName : "";
  let linkClassName = props.linkClassName ? props.linkClassName : "";
  let subListClassName = props.subListClassName ? props.subListClassName : "";

  if (disabled) linkClassName += " disabled";

  return (
    <li className={`nav-item dropdown ${listClassName}`}>
      <button
        className={`btn nav-link dropdown-toggle ${linkClassName}`}
        data-bs-toggle="dropdown"
        onClick={props.onClick}
      >
        {props.title}
      </button>
      <ul className={`dropdown-menu ${subListClassName}`}>{props.children}</ul>
    </li>
  );
}

export default NavDropdown;
