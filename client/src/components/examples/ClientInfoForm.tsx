import ClientInfoForm from "../ClientInfoForm";

export default function ClientInfoFormExample() {
  const handleSubmit = (data: any) => {
    console.log("Client info submitted:", data);
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientInfoForm onSubmit={handleSubmit} />
    </div>
  );
}
