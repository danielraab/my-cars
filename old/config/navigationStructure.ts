import { faHouse, faCar, faGasPump, faWrench, faTrafficLight } from "@fortawesome/free-solid-svg-icons";
import { NavigationLink } from "../lib/frontend/navigaton";

const navigationStructure: NavigationLink[] = [
  { name: "Home", link: "/home", icon: faHouse, loginNecessary: true },
  { name: "Cars", link: "/cars", icon: faCar, loginNecessary: true },
  { name: "Refuel", link: "/refuels", icon: faGasPump, loginNecessary: true },
  { name: "Repair", link: "/repairs", icon: faWrench, loginNecessary: true },
  { name: "Tickets", link: "/tickets", icon: faTrafficLight, loginNecessary: true },
];

export default navigationStructure;
