
import React from "react";
import MainLink from "./MainLink";
import DropdownLinks from "./DropdownLinks";
import { NavigationLink } from "../../lib/frontend/navigaton";

const MainLinks = (props:{navigation:NavigationLink[]}) => {

  let linkList = props.navigation;

  return <>
    {linkList.map((linkElement, idx) => {
      if(linkElement.subLinkList) {
        return <DropdownLinks subLinkObject={linkElement} key={idx} />
      } else {
        return <MainLink linkObject={linkElement} key={idx} />;
      }
    })}
  </>
}

export default MainLinks;