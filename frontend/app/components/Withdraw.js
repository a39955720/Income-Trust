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
import { parseEther } from "viem";
import moment from "moment";
import { IncomeTrustABI, IncomeTrustAddress } from "../constants";

export default function DepositDetails() {
  const { switchChain } = useSwitchChain();
  const { address, isConnected, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [balances, setBalances] = useState([]);
  const [allBalances, setAllBalances] = useState(0);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const { data: contractBalanceData, isLoading: isLoadingBalanceData } =
    useReadContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "getAvailableWithdrawalBalanceArray",
      args: [address],
    });

  const { data: contractAllBalanceData, isLoading: isLoadingAllBalanceData } =
    useReadContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "getAllAvailableWithdrawalBalance",
      args: [address],
    });

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

  useEffect(() => {
    if (contractBalanceData) {
      const [balanceArray, depositArray] = contractBalanceData;
      setBalances(balanceArray);
      setDeposits(depositArray);
    }
  }, [contractBalanceData]);

  useEffect(() => {
    if (contractAllBalanceData) {
      setAllBalances(contractAllBalanceData);
    }
  }, [contractAllBalanceData]);

  const handleWithdrawAll = (e) => {
    e.preventDefault();
    if (chainId != 11155111 && switchChain) {
      switchChain({ chainId: 11155111 });
    }
    setIsLoading(true);
    writeContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "withdrawAll",
      args: [],
    });
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

  const openDetailModal = (deposit) => {
    setSelectedDeposit(deposit);
    setIsModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setSelectedDeposit(null);
  };

  const openWithdrawModal = (deposit) => {
    setSelectedDeposit(deposit);
    setIsWithdrawModalOpen(true);
  };

  if (!isConnected) {
    return (
      <div className="text-center text-gray-600">
        Please connect your wallet to view deposit details.
      </div>
    );
  }

  if (isLoadingBalanceData || isLoadingAllBalanceData) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

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
      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 shadow-md rounded-lg mt-5 mb-5">
      {deposits?.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-500">
              Available Total Withdrawal Amount:{" "}
              <span className="text-blue-500">{`${formatEther(
                allBalances
              )} ETH`}</span>
            </h2>
            <button
              className={`px-4 py-2 rounded ${
                allBalances == 0 || isLoading || isPending || isConfirming
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600"
              } text-white flex justify-center items-center`}
              disabled={
                allBalances == 0 || isLoading || isPending || isConfirming
              }
              onClick={handleWithdrawAll}
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
                "Withdraw All"
              )}
            </button>
          </div>

          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 text-left">
                  Available Withdrawal Amount
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Depositor
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
                    {balances[index] !== null && balances[index] !== undefined
                      ? `${formatEther(balances[index])} ETH`
                      : "N/A"}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {deposit.depositor}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {moment
                      .unix(Number(deposit.startTimestamp))
                      .format("YYYY-MM-DD HH:mm:ss")}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition duration-200 mb-1 mr-1"
                      onClick={() => openDetailModal(deposit)}
                    >
                      Details
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition duration-200 mb-1 mt-1"
                      onClick={() => openWithdrawModal(deposit)}
                    >
                      Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showSuccessModal && <SuccessModal />}
          {showErrorModal && <ErrorModal />}

          {isModalOpen && selectedDeposit && (
            <Modal deposit={selectedDeposit} onClose={closeDetailModal} />
          )}
          {isWithdrawModalOpen && selectedDeposit && (
            <WithdrawModal
              availableAmount={balances[deposits.indexOf(selectedDeposit)]}
              index={deposits.indexOf(selectedDeposit)}
              onClose={() => setIsWithdrawModalOpen(false)}
            />
          )}
        </>
      ) : (
        <p className="text-center text-gray-600">
          No deposits available for withdrawal.
        </p>
      )}
    </div>
  );
}

function Modal({ deposit, onClose }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
  };

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
                    readOnly
                    className="w-full p-2 border border-gray-600 rounded text-white bg-black"
                  />
                </div>
              ))}
            </div>
          ))}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Payout Interval
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={payoutInterval}
                readOnly
                className="w-full p-2 border border-gray-600 rounded text-white bg-black"
              />
              <input
                type="text"
                value={intervalUnit}
                readOnly
                className="p-2 border border-gray-600 rounded text-white bg-black"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTimestamp}
              readOnly
              className="w-full p-2 border border-gray-600 rounded text-white bg-black"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Deposit Amount (ETH)
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
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WithdrawModal({ availableAmount, index, onClose }) {
  const { switchChain } = useSwitchChain();
  const { chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("0");

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

  const handleMaxClick = () => {
    setWithdrawAmount(formatEther(availableAmount));
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const withdrawAmountInWei = parseEther(withdrawAmount);
    const availableAmountInWei = availableAmount;
    if (withdrawAmountInWei > availableAmountInWei) {
      alert("Withdraw amount exceeds available amount.");
      return;
    }
    if (chainId != 11155111 && switchChain) {
      switchChain({ chainId: 11155111 });
    }
    setIsLoading(true);
    writeContract({
      address: IncomeTrustAddress,
      abi: IncomeTrustABI,
      functionName: "withdraw",
      args: [index, parseEther(withdrawAmount)],
    });
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
        className="bg-gray-900 w-1/2 max-w-4xl mx-auto p-6 shadow-md rounded-lg mt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 mx-20">Withdraw</h2>
        <form onSubmit={handleWithdraw} className="space-y-4 mx-20">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Available Withdrawal Amount
            </label>
            <div className="bg-gray-800 p-2 rounded text-white">
              {`${formatEther(availableAmount)} ETH`}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Withdraw Amount (ETH)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded text-white bg-black"
                required
              />
              <button
                type="button"
                onClick={handleMaxClick}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Max
              </button>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                isLoading || isPending || isConfirming
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600"
              } text-white flex justify-center items-center`}
              disabled={isLoading || isPending || isConfirming}
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
                "Confirm Withdraw"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded"
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
