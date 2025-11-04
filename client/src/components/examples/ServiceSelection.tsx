import ServiceSelection from "../ServiceSelection";

export default function ServiceSelectionExample() {
  const handleContinue = (serviceId: string) => {
    console.log("Service selected:", serviceId);
  };

  return (
    <div className="min-h-screen bg-background">
      <ServiceSelection onContinue={handleContinue} />
    </div>
  );
}
