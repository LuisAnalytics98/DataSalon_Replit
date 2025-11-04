import StylistSelection from "../StylistSelection";

export default function StylistSelectionExample() {
  const handleContinue = (stylistId: string) => {
    console.log("Stylist selected:", stylistId);
  };

  return (
    <div className="min-h-screen bg-background">
      <StylistSelection onContinue={handleContinue} />
    </div>
  );
}
