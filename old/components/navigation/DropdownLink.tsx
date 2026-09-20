import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NavDropdownItem from "../utilities/navigation/NavDropdownItem";
import { NavigationLink } from "../../lib/frontend/navigaton";
import useAuth from "../../hooks/use-auth";

const DropdownLink = (props: { subLinkItemObject: NavigationLink }) => {
  const { currentAuth: currentUser } = useAuth();

  return (
    <NavDropdownItem
      to={props.subLinkItemObject.link}
      disabled={props.subLinkItemObject.loginNecessary && !currentUser}
    >
      {props.subLinkItemObject.icon && (
        <FontAwesomeIcon icon={props.subLinkItemObject.icon} />
      )}{" "}
      {props.subLinkItemObject.name}
    </NavDropdownItem>
  );
};

export default DropdownLink;
