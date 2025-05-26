// components/StepperForm/StepperForm.js
"use client";
import { useState } from "react";
import CreateTokenForm from "../CreateTokenForm/CreateTokenForm";
import TokenDistributionForm from "../TokenDistributionForm/TokenDistributionForm";
import TokenConfirmation from "../TokenConfirmation/TokenConfirmation";
import GenerateWallets from "../GenerateWallets/GenerateWallets";
import { useNetwork } from "../../context/networkContext";
import { useTokenCreation } from "../../context/tokenCreationContext";

const StepperForm = () => {
  const [step, setStep] = useState(1);
  const { selectedNetwork } = useNetwork();
  const {
    resetTokenCreation,
    distributionData,
    createToken,
    isCreating,
    creationError,
  } = useTokenCreation();

  const restart = () => {
    resetTokenCreation();
    setStep(1);
  };

  // Handle token creation for bundle launch
  const handleCreateToken = async () => {
    try {
      await createToken(selectedNetwork.type);
      // After successful creation, go to confirmation step
      setStep(4);
    } catch (error) {
      // Error is already handled in the context
      console.error("Failed to create token:", error);
    }
  };

  // Handle next step from TokenDistributionForm based on distribution method
  const handleDistributionNext = () => {
    if (distributionData.method === "generate") {
      setStep(3); // Go to GenerateWallets component
    } else {
      setStep(4); // Go directly to TokenConfirmation (contract call happens in TokenDistributionForm)
    }
  };

  return (
    <>
      {step === 1 && (
        <CreateTokenForm
          onNext={() => setStep(2)}
          onCreateToken={handleCreateToken}
        />
      )}
      {step === 2 && (
        <TokenDistributionForm
          onBack={() => setStep(1)}
          onNext={handleDistributionNext}
          networkType={selectedNetwork.type}
        />
      )}
      {step === 3 && (
        <GenerateWallets
          onBack={() => setStep(2)}
          onNext={() => setStep(4)} // After showing generated wallets, go to confirmation
          networkType={selectedNetwork.type}
        />
      )}
      {step === 4 && <TokenConfirmation onRestart={restart} />}
    </>
  );
};

export default StepperForm;
