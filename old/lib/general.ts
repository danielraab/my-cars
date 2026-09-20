export type KeyValuePairs = { [key: string]: string };

export function typedKeys<T extends {}>(o: T): (keyof T)[] {
  // type cast should be safe because that's what really Object.keys() does
  return Object.keys(o) as (keyof T)[];
}

export function toDatetimeLocal(date: Date): string {
  const ten = function (i: number) {
    return (i < 10 ? "0" : "") + i;
  };
  const YYYY = date.getFullYear(),
    MM = ten(date.getMonth() + 1),
    DD = ten(date.getDate()),
    HH = ten(date.getHours()),
    II = ten(date.getMinutes()),
    SS = ten(date.getSeconds());
  return YYYY + "-" + MM + "-" + DD + "T" + HH + ":" + II + ":" + SS;
}

export function toDateLocal(date: Date): string {
  const ten = function (i: number) {
    return (i < 10 ? "0" : "") + i;
  };
  const YYYY = date.getFullYear(),
    MM = ten(date.getMonth() + 1),
    DD = ten(date.getDate());
  return YYYY + "-" + MM + "-" + DD;
}

export type DateFilterType = {
  from?: Date;
  to?: Date;
};

export type DateObject = {
  date: Date;
};

export function filterDateList<T extends DateObject>(list: T[], filter: DateFilterType) {
  if (filter.from) {
    filter.from = new Date(filter.from);
    filter.from.setHours(0);
    filter.from.setMinutes(0);
    filter.from.setSeconds(0);
  }
  if (filter.to) {
    filter.to.setHours(23);
    filter.to.setMinutes(59);
    filter.to.setSeconds(59);
  }
  return list.filter((item) => {
    if (filter.from && item.date < filter.from) return false;
    if (filter.to && item.date > filter.to) return false;
    return true;
  });
}
