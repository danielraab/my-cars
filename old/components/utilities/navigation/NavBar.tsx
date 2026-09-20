import React from "react";

type NavbarProps = {
  children: any;
  navbarTitle: any;
};

function Navbar(props: NavbarProps) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        {props.navbarTitle}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          {props.children}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
