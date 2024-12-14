import Head from "next/head";
import Header from "../components/Header";
import Withdraw from "../components/Withdraw";

export default function () {
  return (
    <div className="flex-col min-h-screen">
      <Head>
        <title>Income Trust</title>
        <meta name="description" content="" />
      </Head>
      <Header />
      <Withdraw />
    </div>
  );
}
