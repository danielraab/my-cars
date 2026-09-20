import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavLink from "../utilities/navigation/NavLink";
import { NavigationLink } from "../../lib/frontend/navigaton";
import useAuth from "../../hooks/use-auth";

const MainLink = (props: { linkObject: NavigationLink }) => {
  const { currentAuth: currentUser } = useAuth();

  return (
    <NavLink to={props.linkObject.link} disabled={props.linkObject.loginNecessary && !currentUser}>
      {props.linkObject.icon && <FontAwesomeIcon icon={props.linkObject.icon} />} {props.linkObject.name}
    </NavLink>
  );
};

export default MainLink;
