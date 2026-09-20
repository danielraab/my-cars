import React from "react";
import { BulkRecordError } from "sequelize";

type CardProps = {
  className?: string;
  img?: any;
  header?: any;
  children?: any;
  footer?: any;
  onClick?: () => {};
};

const Card = (props: CardProps) => {
  return (
    <div className={`card ${props.className ? props.className : ""}`} onClick={props.onClick}>
      {props.header && <div className="card-header">{props.header}</div>}
      {props.img}
      <div className="card-body">{props.children}</div>
      {props.footer && <div className="card-footer">{props.footer}</div>}
    </div>
  );
};

export default Card;
