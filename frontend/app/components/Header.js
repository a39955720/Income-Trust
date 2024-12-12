import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Header() {
  return (
    <nav className="p-5 border-b-8 border-gray-600 flex flex-row justify-between items-center bg-gray-900">
      <div className="flex items-center">
        <h1 className="font-orbitron py-4 px-4 font-bold text-4xl ml-5 text-white text-shadow-md shadow-gray-700">
          Income Trust
        </h1>
      </div>
      <div className="flex flex-row items-center">
        <Link href="/" legacyBehavior>
          <a className="bg-blue-800 hover:bg-blue-700 h-10 text-white font-bold py-2 mr-4 px-4 rounded-lg ml-auto flex items-center shadow-md hover:shadow-lg transition duration-200 ease-in-out">
            Deposit
          </a>
        </Link>
        <Link href="/withdraw" legacyBehavior>
          <a className="bg-blue-800 hover:bg-blue-700 h-10 text-white font-bold py-2 mr-4 px-4 rounded-lg ml-auto flex items-center shadow-md hover:shadow-lg transition duration-200 ease-in-out">
            Withdraw
          </a>
        </Link>
        <ConnectButton />
      </div>
    </nav>
  );
}
