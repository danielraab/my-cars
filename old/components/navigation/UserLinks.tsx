import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faClipboardList,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";
import NavLink from "../utilities/navigation/NavLink";
import useAuth from "../../hooks/use-auth";

const UserLinks = () => {
  const { currentAuth, logout: logoutUser } = useAuth();

  if (currentAuth) {
    return (
      <>
        <NavLink to="/profile">
          <FontAwesomeIcon icon={faIdCard} /> {currentAuth.user.firstname} {currentAuth.user.lastname} (
          {currentAuth.user.email})
        </NavLink>
        <NavLink onClick={logoutUser}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} /> Logout
        </NavLink>
      </>
    );
  } else {
    return (
      <>
        <NavLink to="/auth/login">
          <FontAwesomeIcon icon={faArrowRightToBracket} /> Login
        </NavLink>
        <NavLink to="/auth/register">
          <FontAwesomeIcon icon={faClipboardList} /> Register
        </NavLink>
      </>
    );
  }
};

export default UserLinks;
