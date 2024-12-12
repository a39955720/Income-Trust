"use client";
import {
  useSwitchChain,
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState, useEffect } from "react";
import { formatEther } from "ethers";
import moment from "moment";
import { IncomeTrustABI, IncomeTrustAddress } from "../constants";

export default function DepositDetails() {
  const { address, isConnected } = useAccount();
  const [depositIds, setDepositIds] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: depositHistory, isPending: isLoadingHistory } = useReadContract(
    {
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "getDepositHistory",
      args: [address],
    }
  );

  useEffect(() => {
    if (depositHistory) {
      setDepositIds(depositHistory);
    }
  }, [depositHistory, isModalOpen]);

  const { data: depositsData, isLoading: isLoadingDeposits } = useReadContract({
    address: IncomeTrustAddress,
    abi: IncomeTrustABI,
    functionName: "getDepositDataArray",
    args: [depositIds],
  });

  useEffect(() => {
    setDeposits(depositsData);
  }, [depositsData]);

  if (!isConnected) {
    return (
      <div className="text-center text-gray-600">
        Please connect your wallet to view deposit details.
      </div>
    );
  }

  if (isLoadingHistory || isLoadingDeposits) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  const openModal = (deposit) => {
    setSelectedDeposit(deposit);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDeposit(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 shadow-md rounded-lg mt-5 mb-5">
      <h1 className="text-2xl font-bold mb-4">Deposit Details</h1>
      {deposits?.length > 0 ? (
        <>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 text-left">
                  Deposit Amount
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Deposit Time
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Beneficiary
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Start Time
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">
                    {formatEther(deposit.depositAmount)} BNB
                  </td>
                  <td className="border border-gray-300 p-2">
                    {moment
                      .unix(Number(deposit.depositTimestamps))
                      .format("YYYY-MM-DD HH:mm:ss")}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {deposit.beneficiary.join(", ")}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {moment
                      .unix(Number(deposit.startTimestamp))
                      .format("YYYY-MM-DD HH:mm:ss")}
                  </td>
                  <td className="border border-gray-300 p-2 justify-around">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200 mb-1"
                      onClick={() => openModal(deposit)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isModalOpen && selectedDeposit && (
            <Modal deposit={selectedDeposit} onClose={closeModal} />
          )}
        </>
      ) : (
        <p className="text-center text-gray-600">No deposit records found.</p>
      )}
    </div>
  );
}

function Modal({ deposit, onClose }) {
  const { switchChain } = useSwitchChain();
  const { chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [beneficiary, setBeneficiary] = useState(deposit.beneficiary);
  const [withdrawalLimits, setWithdrawalLimits] = useState(
    deposit.withdrawalLimitsPercentages
  );
  const [periodicPercentages, setPeriodicPercentages] = useState(
    deposit.periodicPercentages
  );
  const [payoutInterval, setPayoutInterval] = useState(
    deposit.payoutInterval.toString()
  );
  const [intervalUnit, setIntervalUnit] = useState("seconds");
  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date
      .toLocaleString("zh-Hans-CN", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(/\//g, "-")
      .replace(",", "");
  };
  const [startTimestamp, setStartTimestamp] = useState(
    formatTimestamp(deposit.startTimestamp)
  );
  const [depositAmount, setDepositAmount] = useState(
    formatEther(deposit.depositAmount)
  );
  const [isRevoked, setIsRevoked] = useState(deposit.isRevoked);

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

  const handleRemoveField = (index) => {
    const newBeneficiaries = [...beneficiary];
    newBeneficiaries.splice(index, 1);
    setBeneficiary(newBeneficiaries);
  };

  const handleAddField = () => {
    setBeneficiary([...beneficiary, ""]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chainId != 11155111 && switchChain) {
      switchChain({ chainId: 11155111 });
    }
    setIsLoading(true);
    writeContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "modifyDeposit",
      args: [
        deposit.id,
        beneficiary,
        withdrawalLimits.map((value) => parseInt(value, 10)),
        periodicPercentages.map((value) => parseInt(value, 10)),
        convertedPayoutInterval,
        parseInt(convertedStartTimestamp, 10),
      ],
    });
  };

  const revokeDeposit = (e) => {
    e.preventDefault();
    if (chainId != 11155111 && switchChain) {
      switchChain({ chainId: 11155111 });
    }
    setIsLoading(true);
    writeContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "revokeDeposit",
      args: [deposit.id],
    });
  };

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

  const isDisabled = () => {
    const currentTime = new Date();
    const depositTime = new Date(startTimestamp);
    return isRevoked || depositTime < currentTime;
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

  const SuccessModal = () => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={(e) => e.stopPropagation()}
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
          onClick={() => {
            window.location.reload();
            setShowSuccessModal(false);
          }}
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
      onClick={(e) => e.stopPropagation()}
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
            <pre className="whitespace-pre-wrap break-words">
              {writeError?.message || error?.message}
            </pre>
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
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-1/2 max-w-4xl mx-auto p-6 shadow-md rounded-lg mt-5 h-4/5 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 mx-10">Deposit Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4 mx-10">
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
                      [beneficiary, withdrawalLimits, periodicPercentages][i] &&
                      [beneficiary, withdrawalLimits, periodicPercentages][i][
                        index
                      ] !== undefined
                        ? [beneficiary, withdrawalLimits, periodicPercentages][
                            i
                          ][index]
                        : ""
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
              readOnly
              className="w-full p-2 border border-gray-600 rounded text-white bg-black"
            />
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isDisabled() || isLoading || isPending || isConfirming
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600"
              } text-white flex justify-center items-center`}
              disabled={isDisabled() || isLoading || isPending || isConfirming}
            >
              {isLoading || isPending || isConfirming ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Modify"
              )}
            </button>

            <button
              onClick={revokeDeposit}
              className={`px-4 py-2 rounded ${
                isRevoked || isLoading || isPending || isConfirming
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600"
              } text-white flex justify-center items-center`}
              disabled={isRevoked || isLoading || isPending || isConfirming}
            >
              {isLoading || isPending || isConfirming ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Revoke"
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </form>
      </div>
      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
    </div>
  );
}
