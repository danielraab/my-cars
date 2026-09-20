
import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import DropdownLink from "./DropdownLink";
import NavDropdown from "../utilities/navigation/NavDropdown";
import { NavigationLink } from "../../lib/frontend/navigaton";


const DropdownLinks = (props:{subLinkObject:NavigationLink}) => {
  let subLinkObject = props.subLinkObject;

    let complexTitle = <>{subLinkObject.name}</>;
    if (subLinkObject.icon) {
      complexTitle = <><FontAwesomeIcon icon={subLinkObject.icon}/> {subLinkObject.name}</>;
    }


    return (
        <NavDropdown title={complexTitle}>
          {subLinkObject.subLinkList!.map((subElement, idx) => {
            return <DropdownLink subLinkItemObject={subElement} key={idx} />
          })}
        </NavDropdown>
    );
}

export default DropdownLinks;