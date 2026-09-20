import { useState } from "react";
import Button from "../form/Button";

export interface PillData<V extends string> {
  label: string;
  value: V;
}

interface NavPillProps<T extends string> {
  pillList: PillData<T>[];
  initialPill: T;
  onPillChanged: (pill: T) => void;
  className?: string;
}

export default function NavPills<K extends string>(props: NavPillProps<K>) {
  const [activePill, setActivePill] = useState<K>(props.initialPill);
  return (
    <>
      <ul className={`nav nav-pills ${props.className || ""}`}>
        {props.pillList.map((pill) => {
          return (
            <li key={pill.value} className="nav-item">
              <div
                // btnClass="outline-primary"
                className={`nav-link ${pill.value === activePill && "active"}`}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setActivePill(pill.value);
                  props.onPillChanged(pill.value);
                }}
              >
                {pill.label}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
