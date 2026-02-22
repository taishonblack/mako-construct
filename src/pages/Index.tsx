import { HeroSection } from "@/components/landing/HeroSection";
import { BlueprintSection } from "@/components/landing/BlueprintSection";
import { AssemblySection } from "@/components/landing/AssemblySection";
import { ReinforcementSection } from "@/components/landing/ReinforcementSection";
import { InfrastructureSection } from "@/components/landing/InfrastructureSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <BlueprintSection />
      <AssemblySection />
      <ReinforcementSection />
      <InfrastructureSection />
    </main>
  );
};

export default Index;
