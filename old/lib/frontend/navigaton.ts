import {IconDefinition} from "@fortawesome/fontawesome-svg-core";


export type NavigationLink = {
    name: string,
    link?: string,
    loginNecessary?: boolean,
    icon?: IconDefinition
    subLinkList?: NavigationLink[]
}
