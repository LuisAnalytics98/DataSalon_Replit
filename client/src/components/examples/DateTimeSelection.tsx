import DateTimeSelection from "../DateTimeSelection";

export default function DateTimeSelectionExample() {
  const handleContinue = (date: Date, time: string) => {
    console.log("Date and time selected:", date, time);
  };

  return (
    <div className="min-h-screen bg-background">
      <DateTimeSelection onContinue={handleContinue} />
    </div>
  );
}
