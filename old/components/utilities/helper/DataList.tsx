export function DataEntry(props: { title: string; value?: string }) {
  return (
    <>
      <DataEntryTitle title={props.title} />
      <DataEntryValue value={props.value} />
    </>
  );
}

export function DataEntryTitle(props: { title: string }) {
  return (
    <dt className="bg-dark text-white text-end align-middle p-2 m-1" style={{ flexBasis: "20%" }}>
      {props.title}
    </dt>
  );
}

export function DataEntryValue(props: { value?: string }) {
  return (
    <dd className="flex-grow-1 align-middle p-2 m-1 border border-1 border-dark" style={{ flexBasis: "70%" }}>
      {props.value}
    </dd>
  );
}

export function DataList(props: { children: any }) {
  return <dl className="d-flex flex-row flex-wrap">{props.children}</dl>;
}
