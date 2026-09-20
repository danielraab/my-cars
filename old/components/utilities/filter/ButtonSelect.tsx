import { useEffect, useState } from "react";
import Button from "../form/Button";

export type SelectElement = {
  id: number;
  label: string;
  state?: boolean;
};

type ButtonSelectProps<U extends SelectElement> = {
  list: U[];
  onChange: (selected: U[]) => void;
};

export default function ButtonSelect<T extends SelectElement>(props: ButtonSelectProps<T>) {
  function btnClickHandler(id: number) {
    const btn = props.list.find((btn) => btn.id === id)!;
    btn.state = !btn.state;
    props.onChange([...props.list]);
  }
  return (
    <>
      {props.list.map((btn) => (
        <Button
          key={btn.id}
          className="ms-2"
          onClick={() => btnClickHandler(btn.id)}
          btnClass={`${btn.state ? "" : "outline-"}primary`}
        >
          {btn.label}
        </Button>
      ))}
    </>
  );
}
