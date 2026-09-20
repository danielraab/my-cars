type AmountObject = {
  amount: number;
};

export default function AmountSum(props: { list: AmountObject[] }) {
  return (
    <div>
      <strong>Sum: </strong>
      <span>{props.list.reduce((prev, refuel) => prev + refuel.amount, 0).toFixed(2)} €</span>
    </div>
  );
}
