import { MisNpaProvisioningView } from "@/features/mis/components/MisNpaProvisioningView";

export const metadata = {
  title: "NPA Provisioning · eZi-Micro Core Banking",
  description: "NPA classification and provision register",
};

export default function Page() {
  return <MisNpaProvisioningView />;
}
