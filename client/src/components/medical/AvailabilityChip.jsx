export default function AvailabilityChip({ available }) {
  if (available === true) return <span className="badge success">Available</span>;
  if (available === false) return <span className="badge danger">Out</span>;
  return <span className="badge warning">Limited</span>;
}
