import React from 'react'

type StackProps = {
  children: any;
  horizontal?: boolean;
  className?: string;
};

function Stack(props: StackProps) {
  let className = props.horizontal ? "hstack" : "vstack";
  if (props.className) className += ` ${props.className}`;

  return <div className={className}>
    {props.children}
    </div>;
}

export default Stack;
