// components/StepperForm/StepperForm.js
"use client";
import { useState } from "react";
import CreateTokenForm from "../CreateTokenForm/CreateTokenForm";
import { TokenDistributionForm } from "../TokenDistributionForm/TokenDistributionForm";
import TokenConfirmation from "../TokenConfirmation/TokenConfirmation";
import { useNetwork } from "../../context/networkContext";
import { useTokenCreation } from "../../context/tokenCreationContext";

const StepperForm = () => {
  const [step, setStep] = useState(1);
  const { selectedNetwork } = useNetwork();
  const { resetTokenCreation } = useTokenCreation();

  const restart = () => {
    resetTokenCreation();
    setStep(1);
  };

  return (
    <>
      {step === 1 && <CreateTokenForm onNext={() => setStep(2)} />}
      {step === 2 && (
        <TokenDistributionForm
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          networkType={selectedNetwork.type}
        />
      )}
      {step === 3 && <TokenConfirmation onRestart={restart} />}
    </>
  );
};

export default StepperForm;
