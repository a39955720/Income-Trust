"use client";
import {
  useAccount,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { IncomeTrustABI, IncomeTrustAddress } from "../constants";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DepositForm() {
  const [beneficiary, setBeneficiary] = useState([""]);
  const [withdrawalLimits, setWithdrawalLimits] = useState([""]);
  const [periodicPercentages, setPeriodicPercentages] = useState([""]);
  const [payoutInterval, setPayoutInterval] = useState("");
  const [intervalUnit, setIntervalUnit] = useState("seconds");
  const [startTimestamp, setStartTimestamp] = useState("0");
  const [depositAmount, setDepositAmount] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [isBscTestnet, setIsBscTestnet] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { switchChain } = useSwitchChain();
  const { chainId } = useAccount();

  const convertDateToTimestamp = (dateString) => {
    return Math.floor(new Date(dateString).getTime() / 1000);
  };

  const convertToSeconds = (value, unit) => {
    const timeMultipliers = {
      minutes: 60,
      hours: 60 * 60,
      days: 60 * 60 * 24,
      weeks: 60 * 60 * 24 * 7,
      months: 60 * 60 * 24 * 30,
      years: 60 * 60 * 24 * 365,
    };
    return value * (timeMultipliers[unit] || 1);
  };

  const convertedPayoutInterval = convertToSeconds(
    parseInt(payoutInterval, 10),
    intervalUnit
  );
  const convertedStartTimestamp = convertDateToTimestamp(startTimestamp);

  const {
    data: hash,
    writeContract,
    isPending,
    error: writeError,
  } = useWriteContract({});

  const {
    error,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    writeContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "deposit",
      args: [
        beneficiary,
        withdrawalLimits.map((value) => parseInt(value, 10)),
        periodicPercentages.map((value) => parseInt(value, 10)),
        convertedPayoutInterval,
        parseInt(convertedStartTimestamp, 10),
      ],
      value: parseEther(depositAmount),
    });
  };

  const handleAddField = () => {
    setBeneficiary([...beneficiary, ""]);
    setWithdrawalLimits([...withdrawalLimits, ""]);
    setPeriodicPercentages([...periodicPercentages, ""]);
  };

  const handleRemoveField = (index) => {
    setBeneficiary(beneficiary.filter((_, i) => i !== index));
    setWithdrawalLimits(withdrawalLimits.filter((_, i) => i !== index));
    setPeriodicPercentages(periodicPercentages.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isConfirmed) {
      setShowSuccessModal(true);
      setIsLoading(false);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (writeError || error) {
      setShowErrorModal(true);
      setIsLoading(false);
    }
  }, [writeError, error]);

  useEffect(() => {
    setIsBscTestnet(chainId === 97);
  }, [chainId]);

  const SuccessModal = () => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      role="dialog"
      aria-labelledby="success-title"
      aria-modal="true"
    >
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 scale-95">
        <h2
          id="success-title"
          className="text-3xl font-bold text-green-400 mb-4"
        >
          Success!
        </h2>
        <p className="text-gray-300 mb-4">
          Your transaction has been confirmed.
        </p>
        {hash && (
          <div className="bg-gray-700 p-4 rounded-lg text-left text-sm text-gray-400 mb-4">
            <strong>Transaction Hash:</strong>{" "}
            <span className="break-all">{hash}</span>
          </div>
        )}
        <button
          onClick={() => setShowSuccessModal(false)}
          className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  const ErrorModal = () => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      role="dialog"
      aria-labelledby="error-title"
      aria-modal="true"
    >
      <div className="bg-gray-800 w-2/3 p-6 rounded-lg shadow-lg text-center transform transition-all duration-300 scale-95">
        <h2 id="error-title" className="text-3xl font-bold text-red-400 mb-4">
          Error!
        </h2>
        <p className="text-gray-300">
          {writeError?.shortMessage || error?.shortMessage}
        </p>
        {hash && (
          <div className="bg-gray-700 p-4 rounded-lg text-left text-sm text-gray-400">
            <strong>Transaction Hash:</strong>{" "}
            <span className="break-all">{hash}</span>
          </div>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-4 px-6 py-2 mr-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all duration-200"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
        {showDetails && (
          <div className="mt-4 p-4 bg-gray-700 rounded text-left text-sm text-gray-400">
            <pre>{writeError?.message || error?.message}</pre>
          </div>
        )}
        <button
          onClick={() => setShowErrorModal(false)}
          className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-900 shadow-md rounded-lg mt-5 mb-5">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Deposit Form</h1>
        <Link href="/history">
          <h1 className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-700">
            History
          </h1>
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {beneficiary.map((_, index) => (
          <div
            key={index}
            className="space-y-2 border p-4 rounded-lg bg-gray-800 relative"
          >
            <button
              type="button"
              onClick={() => handleRemoveField(index)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
            >
              Remove
            </button>
            {[
              "Beneficiary",
              "Withdrawal Limit Percentage",
              "Periodic Percentage",
            ].map((label, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-white">{`${label} ${
                  index + 1
                }`}</label>
                <input
                  type={i === 0 ? "text" : "number"}
                  value={
                    [beneficiary, withdrawalLimits, periodicPercentages][i][
                      index
                    ]
                  }
                  onChange={(e) => {
                    const setters = [
                      setBeneficiary,
                      setWithdrawalLimits,
                      setPeriodicPercentages,
                    ];
                    const newValue = [
                      ...[beneficiary, withdrawalLimits, periodicPercentages][
                        i
                      ],
                    ];
                    newValue[index] = e.target.value;
                    setters[i](newValue);
                  }}
                  min={i > 0 ? 0 : undefined}
                  max={i > 0 ? 100 : undefined}
                  className="w-full p-2 border border-gray-600 rounded text-white bg-gray-700"
                  required
                />
              </div>
            ))}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddField}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add Beneficiary
        </button>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Payout Interval
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={payoutInterval}
              onChange={(e) => setPayoutInterval(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded text-white bg-gray-700"
              required
            />
            <select
              value={intervalUnit}
              onChange={(e) => setIntervalUnit(e.target.value)}
              className="p-2 border border-gray-600 rounded text-white bg-gray-700"
            >
              {[
                "seconds",
                "minutes",
                "hours",
                "days",
                "weeks",
                "months",
                "years",
              ].map((unit) => (
                <option key={unit} value={unit}>
                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Start Time
          </label>
          <input
            type="datetime-local"
            value={startTimestamp}
            onChange={(e) => setStartTimestamp(e.target.value)}
            className="w-full p-2 border border-gray-600 rounded text-white bg-gray-700"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-white">
            Deposit Amount (BNB)
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="w-full p-2 border border-gray-600 rounded text-white bg-gray-700"
            required
          />
        </div>

        <button
          type={isBscTestnet ? "submit" : "button"}
          disabled={isLoading || isPending || isConfirming}
          onClick={() => {
            if (!isBscTestnet && switchChain) {
              switchChain({ chainId: 97 });
            }
          }}
          className={`w-full px-4 py-2 text-white font-bold rounded ${
            isLoading || isPending || isConfirming
              ? "bg-gray-600"
              : isBscTestnet
              ? "bg-blue-600"
              : "bg-orange-500"
          } mt-4`}
        >
          {isLoading || isPending || isConfirming
            ? "Confirming..."
            : isBscTestnet
            ? "Submit Deposit"
            : "Switch to Bsc Testnet"}
        </button>
      </form>

      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
    </div>
  );
}
