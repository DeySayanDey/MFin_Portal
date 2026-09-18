import { MisNpaProvisioningView } from "@/components/mis/MisNpaProvisioningView";

export const metadata = {
  title: "NPA Provisioning · eZi-Micro Core Banking",
  description: "NPA classification and provision register",
};

export default function Page() {
  return <MisNpaProvisioningView />;
}
