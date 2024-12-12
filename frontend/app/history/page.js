import Head from "next/head";
import Header from "../components/Header";
import DepositHistory from "../components/DepositHistory";

export default function () {
  return (
    <div className="flex-col min-h-screen">
      <Head>
        <title>Income Trust</title>
        <meta name="description" content="" />
      </Head>
      <Header />
      <DepositHistory />
    </div>
  );
}
