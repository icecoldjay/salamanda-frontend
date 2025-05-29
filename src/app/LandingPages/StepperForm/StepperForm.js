// components/StepperForm/StepperForm.js
"use client";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import CreateTokenForm from "../CreateTokenForm/CreateTokenForm";
import TokenDistributionForm from "../TokenDistributionForm/TokenDistributionForm";
import TokenConfirmation from "../TokenConfirmation/TokenConfirmation";
import GenerateWallets from "../GenerateWallets/GenerateWallets";
import { useNetwork } from "../../context/networkContext";
import { useTokenCreation } from "../../context/tokenCreationContext";
import { useEvm } from "../../context/evmContext";

const StepperForm = () => {
  const [step, setStep] = useState(1);
  const { selectedNetwork } = useNetwork();
  const evmContext = useEvm();

  // Get writeContractAsync and waitForTransactionReceiptAsync functions from wagmi
  const { writeContractAsync } = useWriteContract();

  const {
    resetTokenCreation,
    distributionData,
    tokenData,
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
      await createToken(selectedNetwork.type, evmContext, writeContractAsync);
      // After successful creation, go to confirmation step
      setStep(4);
    } catch (error) {
      console.error("Failed to create token:", error);
    }
  };

  // Handle next step from TokenDistributionForm based on distribution method
  const handleDistributionNext = () => {
    if (distributionData.method === "generate") {
      setStep(3); // Go to GenerateWallets component
    } else {
      setStep(4); // Go directly to TokenConfirmation
    }
  };

  // Handle next step from CreateTokenForm when bundle launch is NOT enabled
  const handleCreateTokenNext = async () => {
    if (!tokenData.bundleLaunch) {
      try {
        await createToken(selectedNetwork.type, evmContext, writeContractAsync);
        setStep(4);
      } catch (error) {
        console.error("Failed to create token:", error);
      }
    } else {
      setStep(2);
    }
  };

  return (
    <>
      {step === 1 && (
        <CreateTokenForm
          onNext={handleCreateTokenNext}
          onCreateToken={handleCreateToken}
          setStep={setStep}
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
          onNext={() => setStep(4)}
          networkType={selectedNetwork.type}
        />
      )}
      {step === 4 && <TokenConfirmation onRestart={restart} />}
    </>
  );
};

export default StepperForm;
