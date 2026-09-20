import React from 'react'

export type BootstrapBreakpoints = "sm" |"md" |"lg" |"xl" |"xxl"

function Container(props: {children:any, className?:string, breakpoint?:BootstrapBreakpoints, fluid?:boolean}) {

    let className = "container"

    if(props.fluid) className += "-fluid"
    else if(props.breakpoint) className += `-${props.breakpoint}`

    if(props.className) className += ` ${props.className}`

    return(<div className={className}>
        {props.children}
    </div>)
}

export function Row(props: {children:any, className?:string}) {
    return <div className={`row ${props.className ? props.className : ""}`}>{props.children}</div>
}

export function Col(props: {children:any, className?:string}) {
    return <div className={`col ${props.className ? props.className : ""}`}>{props.children}</div>
}

export default Container