import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCarSide } from "@fortawesome/free-solid-svg-icons";
import UserLinks from "./UserLinks";
import MainLinks from "./MainLinks";
import NavBrand from "../utilities/navigation/NavBrand";
import Navbar from "../utilities/navigation/NavBar";
import navigationStructure from "../../config/navigationStructure"


const NavigationHeader = () => {

  const navigaton = navigationStructure;

  const navbarTitle = (
    <NavBrand to="/">
      <FontAwesomeIcon icon={faCarSide} bounce />
      {" " + process.env.NEXT_PUBLIC_APP_NAME}
    </NavBrand>
  );

  return (
    <Navbar navbarTitle={navbarTitle}>
      <ul className="navbar-nav me-auto mb-2 mb-lg-0">
        <MainLinks navigation={navigationStructure} />
      </ul>
      <ul className="navbar-nav">
        <UserLinks />
      </ul>
    </Navbar>
  );
};

export default NavigationHeader;
