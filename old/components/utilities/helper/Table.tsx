import React from "react";
import { Variants } from "../../../lib/frontend/bootstrap.t";

type TableProps = {
  children: any;
  striped?: boolean;
  stripedColumns?: boolean;
  variant?: Variants;
  hoverable?: boolean;
  bordered?: boolean;
  borderless?: boolean;
  small?: boolean;
  responsive?: boolean;
};

const Table = (props: TableProps) => {
  let className = "table";
  if (props.striped) className += " table-striped";
  if (props.stripedColumns) className += " table-striped-columns";
  if (props.variant) className += " table-" + props.variant;
  if (props.hoverable) className += " table-hover";
  if (props.bordered) className += " table-bordered";
  else if (props.borderless) className += " table-borderless";
  if (props.small) className += " table-sm";

  const table = <table className={className}>{props.children}</table>;

  if (props.responsive) return <div className="table-responsive">{table}</div>;
  else return table;
};

export default Table;
