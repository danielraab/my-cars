import Link from "next/link";
import React from "react";

type NavBrandProps = {
  children: any;
  to?: string;
  className?: string;
};

function NavBrand(props: NavBrandProps) {
  const mainClassName = props.className ? props.className : "";

  if (props.to) {
    // return a link element if it contains a href
    return (
      <Link href={props.to} className={`navbar-brand ${mainClassName}`}>
        {props.children}
      </Link>
    );
  }

  return (
    <span className={`navbar-brand mb-0 h1 ${mainClassName}`}>
      {props.children}
    </span>
  );
}

export default NavBrand;
